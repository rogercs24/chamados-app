import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

function criarService(prismaMock: unknown) {
  const jwt = { sign: jest.fn().mockReturnValue('access.jwt') };
  const config = {
    get: jest.fn((chave: string) => {
      if (chave === 'JWT_REFRESH_TTL') return 604800;
      if (chave === 'JWT_ACCESS_TTL') return 900;
      return 'secret';
    }),
  };
  return new TokenService(
    jwt as never,
    config as never,
    prismaMock as never,
  );
}

describe('TokenService.rotate (refresh rotativo + detecção de reuso)', () => {
  it('recusa token inexistente', async () => {
    const prisma = {
      refreshToken: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = criarService(prisma);
    await expect(service.rotate('x', {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('ao reusar um token revogado, revoga a família inteira e recusa', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 3 });
    const prisma = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rt1',
          family: 'fam-1',
          userId: 'u1',
          revogadoEm: new Date(),
          expiraEm: new Date(Date.now() + 100000),
        }),
        updateMany,
      },
    };
    const service = criarService(prisma);

    await expect(service.rotate('tok', {})).rejects.toMatchObject({
      reuseDetected: true,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { family: 'fam-1', revogadoEm: null },
      data: { revogadoEm: expect.any(Date) },
    });
  });

  it('rotaciona: revoga o antigo e cria um novo na mesma família', async () => {
    const prisma = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rt1',
          family: 'fam-1',
          userId: 'u1',
          revogadoEm: null,
          expiraEm: new Date(Date.now() + 100000),
        }),
        create: jest.fn().mockResolvedValue({ id: 'rt2' }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          tenantId: 't1',
          papel: 'ADMIN',
          email: 'a@a.com',
          nome: 'A',
          ativo: true,
        }),
      },
    };
    const service = criarService(prisma);

    const resultado = await service.rotate('tok', {});

    expect(resultado.accessToken).toBe('access.jwt');
    expect(resultado.refreshToken).toEqual(expect.any(String));
    expect(prisma.refreshToken.create.mock.calls[0][0].data.family).toBe('fam-1');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt1' },
      data: { revogadoEm: expect.any(Date), substituidoPorId: 'rt2' },
    });
  });
});
