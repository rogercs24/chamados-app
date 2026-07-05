import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Area, Papel, Prioridade, StatusChamado } from '@prisma/client';
import { TriageTicketUseCase } from './triage-ticket.use-case';

describe('TriageTicketUseCase (triagem abre o chamado)', () => {
  const repo = { findById: jest.fn(), update: jest.fn() };
  const audit = { registrar: jest.fn() };
  const realtime = { emitToTenant: jest.fn() };
  const useCase = new TriageTicketUseCase(
    repo as never,
    audit as never,
    realtime as never,
  );
  const gestor = {
    id: 'g1',
    tenantId: 't1',
    papel: Papel.TRIAGEM,
    email: 'g@t.com',
    nome: 'Gestor',
  };
  const dto = { prioridade: Prioridade.ALTA, area: Area.TI };

  beforeEach(() => jest.clearAllMocks());

  it('404 quando o chamado não existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('x', dto, gestor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('recusa triar um chamado que já saiu da triagem', async () => {
    repo.findById.mockResolvedValue({ id: 'x', status: StatusChamado.ABERTO });
    await expect(useCase.execute('x', dto, gestor)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('define prioridade + área, abre o chamado, audita e emite evento', async () => {
    repo.findById.mockResolvedValue({ id: 'x', status: StatusChamado.TRIAGEM });
    repo.update.mockResolvedValue({ id: 'x', status: StatusChamado.ABERTO });

    const resultado = await useCase.execute('x', dto, gestor);

    expect(repo.update).toHaveBeenCalledWith('x', {
      prioridade: Prioridade.ALTA,
      area: Area.TI,
      status: StatusChamado.ABERTO,
    });
    expect(audit.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ acao: expect.any(String), entidadeId: 'x' }),
    );
    expect(realtime.emitToTenant).toHaveBeenCalledWith(
      't1',
      'ticket:triaged',
      expect.objectContaining({ id: 'x', area: Area.TI }),
    );
    expect(resultado?.status).toBe(StatusChamado.ABERTO);
  });
});
