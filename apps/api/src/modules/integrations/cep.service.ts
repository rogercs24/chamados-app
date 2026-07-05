import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

export interface CepData {
  cep: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

/** Consulta de CEP via ViaCEP, com cache no Redis (24h). */
@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private readonly ttlSegundos = 60 * 60 * 24;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private normalizar(cep: string): string {
    const digitos = cep.replace(/\D/g, '');
    if (digitos.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 dígitos');
    }
    return digitos;
  }

  async consultar(cepRaw: string): Promise<CepData> {
    const cep = this.normalizar(cepRaw);
    const chave = `cep:${cep}`;

    const cache = await this.redis.get(chave);
    if (cache) return JSON.parse(cache) as CepData;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'chamados-saas/1.0',
          Accept: 'application/json',
        },
      });
      if (!resp.ok) {
        throw new BadRequestException('falha ao consultar o CEP');
      }
      const raw = (await resp.json()) as Record<string, unknown>;
      if (raw.erro) {
        throw new NotFoundException('CEP não encontrado');
      }
      const data: CepData = {
        cep,
        logradouro: (raw.logradouro as string) || undefined,
        bairro: (raw.bairro as string) || undefined,
        cidade: (raw.localidade as string) || undefined,
        uf: (raw.uf as string) || undefined,
      };
      await this.redis.set(chave, JSON.stringify(data), 'EX', this.ttlSegundos);
      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao consultar CEP: ${String(error)}`);
      throw new BadRequestException('não foi possível consultar o CEP agora');
    } finally {
      clearTimeout(timer);
    }
  }
}
