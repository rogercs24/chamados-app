import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { PasswordService } from '../services/password.service';
import { MfaService } from '../services/mfa.service';
import { RequestMeta, TokenService } from '../services/token.service';
import { LoginDto } from '../dto/login.dto';
import { toUsuarioPublico } from '../presenters/user.presenter';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly mfa: MfaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: LoginDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Mensagem genérica para não revelar se o e-mail existe.
    const falhaGenerica = () =>
      new UnauthorizedException('e-mail ou senha inválidos');

    if (!user || !user.senhaHash) {
      await this.audit.registrar({
        acao: AuditAction.LOGIN_FAILED,
        metadata: { email },
        ...meta,
      });
      throw falhaGenerica();
    }

    const senhaOk = await this.password.verify(user.senhaHash, dto.senha);
    if (!senhaOk) {
      await this.audit.registrar({
        acao: AuditAction.LOGIN_FAILED,
        tenantId: user.tenantId,
        actorId: user.id,
        ...meta,
      });
      throw falhaGenerica();
    }

    if (!user.ativo) {
      throw new UnauthorizedException('conta desativada');
    }

    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        throw new UnauthorizedException(
          'MFA obrigatório: informe o código de 6 dígitos no campo mfaCode',
        );
      }
      const mfaOk = !!user.mfaSecret && this.mfa.verify(dto.mfaCode, user.mfaSecret);
      if (!mfaOk) {
        await this.audit.registrar({
          acao: AuditAction.LOGIN_FAILED,
          tenantId: user.tenantId,
          actorId: user.id,
          metadata: { motivo: 'mfa_invalido' },
          ...meta,
        });
        throw new UnauthorizedException('código MFA inválido');
      }
    }

    const tokens = await this.tokens.issuePair(user, meta);
    await this.audit.registrar({
      acao: AuditAction.LOGIN,
      tenantId: user.tenantId,
      actorId: user.id,
      ...meta,
    });

    return { usuario: toUsuarioPublico(user), ...tokens };
  }
}
