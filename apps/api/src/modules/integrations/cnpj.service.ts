import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

export interface CnpjData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
}

/** Consulta de CNPJ via BrasilAPI, com cache no Redis (24h). */
@Injectable()
export class CnpjService {
  private readonly logger = new Logger(CnpjService.name);
  private readonly ttlSegundos = 60 * 60 * 24;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private normalizar(cnpj: string): string {
    const digitos = cnpj.replace(/\D/g, '');
    if (digitos.length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos');
    }
    return digitos;
  }

  async consultar(cnpjRaw: string): Promise<CnpjData> {
    const cnpj = this.normalizar(cnpjRaw);
    const chave = `cnpj:${cnpj}`;

    const cache = await this.redis.get(chave);
    if (cache) return JSON.parse(cache) as CnpjData;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const resp = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'chamados-saas/1.0',
            Accept: 'application/json',
          },
        },
      );
      if (resp.status === 404) {
        throw new NotFoundException('CNPJ não encontrado');
      }
      if (!resp.ok) {
        throw new BadRequestException('falha ao consultar o CNPJ');
      }
      const raw = (await resp.json()) as Record<string, unknown>;
      const data: CnpjData = {
        cnpj,
        razaoSocial: String(raw.razao_social ?? raw.nome ?? ''),
        nomeFantasia: (raw.nome_fantasia as string) || undefined,
        cep: raw.cep ? String(raw.cep).replace(/\D/g, '') : undefined,
        logradouro: (raw.logradouro as string) || undefined,
        numero: raw.numero ? String(raw.numero) : undefined,
        bairro: (raw.bairro as string) || undefined,
        cidade: (raw.municipio as string) || undefined,
        uf: (raw.uf as string) || undefined,
        telefone: (raw.ddd_telefone_1 as string) || undefined,
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
      this.logger.error(`Erro ao consultar CNPJ: ${String(error)}`);
      throw new BadRequestException('não foi possível consultar o CNPJ agora');
    } finally {
      clearTimeout(timer);
    }
  }
}
