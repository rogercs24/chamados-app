import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Papel } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contexto(user: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorMock(isPublic: unknown, roles: unknown): Reflector {
  return {
    getAllAndOverride: jest
      .fn()
      .mockReturnValueOnce(isPublic)
      .mockReturnValueOnce(roles),
  } as unknown as Reflector;
}

describe('RolesGuard (RBAC)', () => {
  it('libera quando a rota não exige papel', () => {
    const guard = new RolesGuard(reflectorMock(false, undefined));
    expect(guard.canActivate(contexto({ papel: Papel.SOLICITANTE }))).toBe(true);
  });

  it('libera quando o papel do usuário está entre os exigidos', () => {
    const guard = new RolesGuard(reflectorMock(false, [Papel.ADMIN]));
    expect(guard.canActivate(contexto({ papel: Papel.ADMIN }))).toBe(true);
  });

  it('nega quando o papel não está entre os exigidos', () => {
    const guard = new RolesGuard(reflectorMock(false, [Papel.ADMIN]));
    expect(() =>
      guard.canActivate(contexto({ papel: Papel.SOLICITANTE })),
    ).toThrow(ForbiddenException);
  });

  it('libera rota pública sem checar papel', () => {
    const guard = new RolesGuard(reflectorMock(true, [Papel.ADMIN]));
    expect(guard.canActivate(contexto(undefined))).toBe(true);
  });
});
