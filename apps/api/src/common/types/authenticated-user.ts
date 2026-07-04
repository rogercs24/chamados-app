import { Papel } from '@prisma/client';

/** Usuário anexado à requisição pelo JwtStrategy (req.user). */
export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  papel: Papel;
  email: string;
  nome: string;
}

/** Payload assinado no access token (JWT). */
export interface JwtPayload {
  sub: string;
  tenantId: string;
  papel: Papel;
  email: string;
  nome: string;
}
