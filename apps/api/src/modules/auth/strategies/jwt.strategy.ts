import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TenantContextService } from '../../../common/context/tenant-context.service';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/types/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly tenantContext: TenantContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-secret',
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    // Preenche o contexto de tenant para a Prisma Extension (isolamento).
    this.tenantContext.set({
      tenantId: payload.tenantId,
      userId: payload.sub,
      papel: payload.papel,
    });
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      papel: payload.papel,
      email: payload.email,
      nome: payload.nome,
    };
  }
}
