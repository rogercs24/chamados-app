import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { RequestMeta, TokenService } from '../services/token.service';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async execute(refreshToken: string, meta: RequestMeta) {
    try {
      const resultado = await this.tokens.rotate(refreshToken, meta);
      await this.audit.registrar({
        acao: AuditAction.TOKEN_REFRESH,
        tenantId: resultado.user.tenantId,
        actorId: resultado.user.id,
        ...meta,
      });
      return {
        accessToken: resultado.accessToken,
        refreshToken: resultado.refreshToken,
      };
    } catch (error) {
      if ((error as { reuseDetected?: boolean }).reuseDetected) {
        await this.audit.registrar({
          acao: AuditAction.TOKEN_REUSE_DETECTED,
          ...meta,
        });
      }
      throw error;
    }
  }
}
