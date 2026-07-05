import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Papel } from '@prisma/client';
import { ChangeRoleUseCase } from './change-role.use-case';

describe('ChangeRoleUseCase (regras de permissão)', () => {
  const repo = { findById: jest.fn(), update: jest.fn() };
  const audit = { registrar: jest.fn() };
  const tokens = { revokeAllForUser: jest.fn() };
  const useCase = new ChangeRoleUseCase(
    repo as never,
    audit as never,
    tokens as never,
  );
  const admin = {
    id: 'admin1',
    tenantId: 't1',
    papel: Papel.ADMIN,
    email: 'a@a.com',
    nome: 'Admin',
  };

  beforeEach(() => jest.clearAllMocks());

  it('bloqueia alterar o próprio papel', async () => {
    await expect(
      useCase.execute('admin1', { papel: Papel.TI }, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ADMIN não pode conceder SUPER_ADMIN', async () => {
    await expect(
      useCase.execute('u2', { papel: Papel.SUPER_ADMIN }, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404 quando o usuário não existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('u2', { papel: Papel.TI }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('altera papel, revoga sessões e audita a mudança', async () => {
    repo.findById.mockResolvedValue({
      id: 'u2',
      papel: Papel.SOLICITANTE,
      tenantId: 't1',
      email: 'u@u.com',
      nome: 'U',
      ativo: true,
      mfaEnabled: false,
    });
    repo.update.mockResolvedValue({
      id: 'u2',
      papel: Papel.TI,
      tenantId: 't1',
      email: 'u@u.com',
      nome: 'U',
      ativo: true,
      mfaEnabled: false,
    });

    const resultado = await useCase.execute('u2', { papel: Papel.TI }, admin);

    expect(repo.update).toHaveBeenCalledWith('u2', { papel: Papel.TI });
    expect(tokens.revokeAllForUser).toHaveBeenCalledWith('u2');
    expect(audit.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: 'user.permission_changed',
        metadata: { de: Papel.SOLICITANTE, para: Papel.TI },
      }),
    );
    expect(resultado.papel).toBe(Papel.TI);
  });
});
