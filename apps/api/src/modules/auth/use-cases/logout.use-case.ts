import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { RequestMeta, TokenService } from '../services/token.service';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    refreshToken: string | undefined,
    user: AuthenticatedUser | undefined,
    meta: RequestMeta,
  ): Promise<void> {
    if (refreshToken) {
      await this.tokens.revoke(refreshToken);
    }
    await this.audit.registrar({
      acao: AuditAction.LOGOUT,
      tenantId: user?.tenantId,
      actorId: user?.id,
      ...meta,
    });
  }
}
