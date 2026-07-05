import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';
import { buscarFaq, FAQ_DATA, FaqItem } from './faq.data';

const TTL_SEGUNDOS = 30 * 60; // 30 minutos
const prefixo = (token: string) => `faq:consulta:${token}`;

interface Consulta {
  tenantId: string;
  userId: string;
  termo: string;
}

/**
 * FAQ + tokens de consulta de uso único. O token comprova que o usuário
 * consultou o FAQ antes de abrir um chamado (regra do app original). Guardado no
 * Redis com TTL — some sozinho e sobrevive a múltiplas instâncias da API.
 */
@Injectable()
export class FaqService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  buscar(termo?: string): FaqItem[] {
    return termo ? buscarFaq(termo) : [];
  }

  /** Todas as perguntas (para a base de conhecimento navegável). */
  todos(): FaqItem[] {
    return FAQ_DATA;
  }

  /** Registra a consulta e devolve um token de uso único (válido por 30 min). */
  async registrarConsulta(
    tenantId: string,
    userId: string,
    termo: string,
  ): Promise<string> {
    const token = randomBytes(24).toString('hex');
    const dados: Consulta = { tenantId, userId, termo };
    await this.redis.set(prefixo(token), JSON.stringify(dados), 'EX', TTL_SEGUNDOS);
    return token;
  }

  /**
   * Valida e CONSOME o token (uso único). Retorna motivo quando inválido.
   * Confere que o token pertence ao mesmo tenant e usuário.
   */
  async validarEConsumir(
    token: string | undefined,
    tenantId: string,
    userId: string,
  ): Promise<{ valido: boolean; motivo?: string }> {
    if (!token) return { valido: false, motivo: 'token ausente' };
    // GETDEL é atômico: lê e apaga de uma vez (evita reuso concorrente).
    const bruto = await this.redis.getdel(prefixo(token));
    if (!bruto) return { valido: false, motivo: 'token não encontrado ou expirado' };

    const dados = JSON.parse(bruto) as Consulta;
    if (dados.tenantId !== tenantId || dados.userId !== userId) {
      return { valido: false, motivo: 'token não pertence a este usuário' };
    }
    return { valido: true };
  }
}
