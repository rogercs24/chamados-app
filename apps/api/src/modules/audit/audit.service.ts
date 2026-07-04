import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface AuditEntry {
  acao: string;
  tenantId?: string | null;
  actorId?: string | null;
  entidade?: string;
  entidadeId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Registra um evento. Falhas de auditoria não interrompem o fluxo principal. */
  async registrar(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          acao: entry.acao,
          tenantId: entry.tenantId ?? null,
          actorId: entry.actorId ?? null,
          entidade: entry.entidade,
          entidadeId: entry.entidadeId,
          metadata: (entry.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Falha ao registrar auditoria: ${String(error)}`);
    }
  }
}
