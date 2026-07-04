import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { JwtPayload } from '../../../common/types/authenticated-user';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

type TokenUser = Pick<User, 'id' | 'tenantId' | 'papel' | 'email' | 'nome'>;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private refreshTtlSeconds(): number {
    return Number(this.config.get('JWT_REFRESH_TTL') ?? 604800);
  }

  signAccessToken(user: TokenUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      papel: user.papel,
      email: user.email,
      nome: user.nome,
    };
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: Number(this.config.get('JWT_ACCESS_TTL') ?? 900),
    });
  }

  /** Emite um novo par (nova família de refresh). Usado no login/registro/oauth. */
  async issuePair(user: TokenUser, meta: RequestMeta): Promise<TokenPair> {
    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        family: randomUUID(),
        expiraEm: new Date(Date.now() + this.refreshTtlSeconds() * 1000),
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    return { accessToken: this.signAccessToken(user), refreshToken };
  }

  /**
   * Rotaciona um refresh token. Detecta reuso: se o token apresentado já estava
   * revogado, revoga toda a família (sessão comprometida) e recusa.
   */
  async rotate(
    presentedToken: string,
    meta: RequestMeta,
  ): Promise<TokenPair & { user: TokenUser; reuseDetected?: boolean }> {
    const tokenHash = this.hashToken(presentedToken);
    const existente = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existente) {
      throw new UnauthorizedException('refresh token inválido');
    }

    if (existente.revogadoEm) {
      // Reuso de token revogado → possível vazamento. Encerra a família toda.
      await this.prisma.refreshToken.updateMany({
        where: { family: existente.family, revogadoEm: null },
        data: { revogadoEm: new Date() },
      });
      const erro = new UnauthorizedException(
        'refresh token reutilizado — sessão encerrada por segurança',
      );
      (erro as unknown as { reuseDetected: boolean }).reuseDetected = true;
      throw erro;
    }

    if (existente.expiraEm.getTime() < Date.now()) {
      throw new UnauthorizedException('refresh token expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existente.userId },
    });
    if (!user || !user.ativo) {
      throw new UnauthorizedException('usuário inválido ou inativo');
    }

    const novoToken = randomBytes(48).toString('hex');
    const criado = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(novoToken),
        family: existente.family,
        expiraEm: new Date(Date.now() + this.refreshTtlSeconds() * 1000),
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    await this.prisma.refreshToken.update({
      where: { id: existente.id },
      data: { revogadoEm: new Date(), substituidoPorId: criado.id },
    });

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: novoToken,
      user,
    };
  }

  /** Revoga um refresh token específico (logout). */
  async revoke(presentedToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(presentedToken), revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  }

  /** Revoga todas as sessões de um usuário. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  }
}
