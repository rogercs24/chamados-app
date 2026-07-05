import { CreateClientUseCase } from './create-client.use-case';

describe('CreateClientUseCase (enriquecimento por CNPJ)', () => {
  const repo = { create: jest.fn() };
  const cnpj = { consultar: jest.fn() };
  const audit = { registrar: jest.fn() };
  const useCase = new CreateClientUseCase(
    repo as never,
    cnpj as never,
    audit as never,
  );
  const actor = {
    id: 'a',
    tenantId: 't1',
    papel: 'ADMIN' as never,
    email: 'a@a.com',
    nome: 'A',
  };

  beforeEach(() => jest.clearAllMocks());

  it('enriquece via BrasilAPI quando razaoSocial não é informada', async () => {
    cnpj.consultar.mockResolvedValue({
      cnpj: '19131243000197',
      razaoSocial: 'OPEN KNOWLEDGE',
      cidade: 'SAO PAULO',
      uf: 'SP',
    });
    repo.create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve({ id: 'c1', tenantId: 't1', deletedAt: null, ...data }),
    );

    const resultado = await useCase.execute(
      { cnpj: '19.131.243/0001-97' },
      actor,
    );

    expect(cnpj.consultar).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: '19131243000197',
        razaoSocial: 'OPEN KNOWLEDGE',
        cidade: 'SAO PAULO',
      }),
    );
    expect(resultado.razaoSocial).toBe('OPEN KNOWLEDGE');
  });

  it('não consulta a BrasilAPI quando razaoSocial já foi informada', async () => {
    repo.create.mockResolvedValue({
      id: 'c2',
      tenantId: 't1',
      deletedAt: null,
      cnpj: '11222333000181',
      razaoSocial: 'Manual LTDA',
    });

    await useCase.execute(
      { cnpj: '11.222.333/0001-81', razaoSocial: 'Manual LTDA' },
      actor,
    );

    expect(cnpj.consultar).not.toHaveBeenCalled();
  });
});
