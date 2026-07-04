import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { MfaService } from '../services/mfa.service';
import { TokenService } from '../services/token.service';

/** Fluxos de MFA/TOTP: setup (gera segredo+QR), ativar e desativar. */
@Injectable()
export class MfaUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mfa: MfaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async setup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('usuário não encontrado');
    if (user.mfaEnabled) {
      throw new BadRequestException('MFA já está ativo');
    }

    const secret = this.mfa.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const otpauthUrl = this.mfa.keyUri(user.email, secret);
    const qrCode = await this.mfa.qrCodeDataUrl(otpauthUrl);
    return { secret, otpauthUrl, qrCode };
  }

  async enable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) {
      throw new BadRequestException('inicie o setup de MFA antes de ativar');
    }
    if (!this.mfa.verify(token, user.mfaSecret)) {
      throw new BadRequestException('código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
    // força re-login com MFA em todas as sessões
    await this.tokens.revokeAllForUser(userId);

    await this.audit.registrar({
      acao: AuditAction.MFA_ENABLED,
      tenantId: user.tenantId,
      actorId: userId,
      entidade: 'User',
      entidadeId: userId,
    });
    return { mfaEnabled: true };
  }

  async disable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA não está ativo');
    }
    if (!this.mfa.verify(token, user.mfaSecret)) {
      throw new BadRequestException('código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    await this.audit.registrar({
      acao: AuditAction.MFA_DISABLED,
      tenantId: user.tenantId,
      actorId: userId,
      entidade: 'User',
      entidadeId: userId,
    });
    return { mfaEnabled: false };
  }
}
