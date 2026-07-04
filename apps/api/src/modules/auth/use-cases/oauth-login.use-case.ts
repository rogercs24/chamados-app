import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { RequestMeta, TokenService } from '../services/token.service';
import { toUsuarioPublico } from '../presenters/user.presenter';

export interface OAuthProfile {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
}

/**
 * OAuth autentica (não provisiona): casa o e-mail do provedor com um usuário
 * existente e vincula o providerId no primeiro uso (ver ADR-0004).
 */
@Injectable()
export class OAuthLoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async execute(profile: OAuthProfile, meta: RequestMeta) {
    const email = profile.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException(
        'nenhuma conta encontrada para este e-mail. Peça a um administrador para criar seu acesso.',
      );
    }
    if (!user.ativo) {
      throw new UnauthorizedException('conta desativada');
    }

    // Vincula o provedor na primeira vez.
    if (profile.provider === 'google' && !user.googleId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.providerId },
      });
    } else if (profile.provider === 'github' && !user.githubId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { githubId: profile.providerId },
      });
    }

    const tokens = await this.tokens.issuePair(user, meta);
    await this.audit.registrar({
      acao: AuditAction.OAUTH_LOGIN,
      tenantId: user.tenantId,
      actorId: user.id,
      metadata: { provider: profile.provider },
      ...meta,
    });

    return { usuario: toUsuarioPublico(user), ...tokens };
  }
}
