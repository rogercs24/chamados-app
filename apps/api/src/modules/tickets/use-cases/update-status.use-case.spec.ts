import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Area, Papel, StatusChamado } from '@prisma/client';
import { UpdateStatusUseCase } from './update-status.use-case';

describe('UpdateStatusUseCase (transições de status)', () => {
  const repo = { findById: jest.fn(), update: jest.fn() };
  const audit = { registrar: jest.fn() };
  const realtime = { emitToTenant: jest.fn() };
  const useCase = new UpdateStatusUseCase(
    repo as never,
    audit as never,
    realtime as never,
  );
  const admin = {
    id: 'a1',
    tenantId: 't1',
    papel: Papel.ADMIN,
    email: 'a@t.com',
    nome: 'Admin',
  };
  const tiTI = {
    id: 'ti1',
    tenantId: 't1',
    papel: Papel.TI,
    email: 'ti@t.com',
    nome: 'TI',
  };

  beforeEach(() => jest.clearAllMocks());

  it('recusa voltar para TRIAGEM por esta via', async () => {
    await expect(
      useCase.execute('x', { status: StatusChamado.TRIAGEM }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 quando o chamado não existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('x', { status: StatusChamado.RESOLVIDO }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('atendente de outra área não pode atuar (404, não vaza existência)', async () => {
    repo.findById.mockResolvedValue({
      id: 'x',
      status: StatusChamado.ABERTO,
      area: Area.TRADE,
    });
    await expect(
      useCase.execute('x', { status: StatusChamado.EM_ANDAMENTO }, tiTI),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ao FECHAR, grava fechadoEm, audita e emite', async () => {
    repo.findById.mockResolvedValue({
      id: 'x',
      status: StatusChamado.RESOLVIDO,
      area: Area.TI,
      fechadoEm: null,
    });
    repo.update.mockResolvedValue({ id: 'x', status: StatusChamado.FECHADO });

    await useCase.execute('x', { status: StatusChamado.FECHADO }, admin);

    const patch = repo.update.mock.calls[0][1];
    expect(patch.status).toBe(StatusChamado.FECHADO);
    expect(patch.fechadoEm).toBeInstanceOf(Date);
    expect(audit.registrar).toHaveBeenCalled();
    expect(realtime.emitToTenant).toHaveBeenCalledWith(
      't1',
      'ticket:status',
      expect.objectContaining({ id: 'x', status: StatusChamado.FECHADO }),
    );
  });
});
