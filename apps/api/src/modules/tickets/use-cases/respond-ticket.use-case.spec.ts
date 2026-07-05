import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Area, Papel, StatusChamado } from '@prisma/client';
import { RespondTicketUseCase } from './respond-ticket.use-case';

describe('RespondTicketUseCase (atendimento)', () => {
  const repo = {
    findById: jest.fn(),
    createResponse: jest.fn(),
    createAttachment: jest.fn(),
    update: jest.fn(),
  };
  const audit = { registrar: jest.fn() };
  const realtime = { emitToTenant: jest.fn() };
  const storage = { save: jest.fn() };
  const useCase = new RespondTicketUseCase(
    repo as never,
    audit as never,
    realtime as never,
    storage as never,
  );
  const atendenteTI = {
    id: 'ti1',
    tenantId: 't1',
    papel: Papel.TI,
    email: 'ti@t.com',
    nome: 'TI',
  };
  const dto = { texto: 'estamos analisando' };

  beforeEach(() => jest.clearAllMocks());

  it('404 quando o atendente é de outra área', async () => {
    repo.findById.mockResolvedValue({
      id: 'x',
      status: StatusChamado.ABERTO,
      area: Area.TRADE,
    });
    await expect(
      useCase.execute('x', dto, atendenteTI),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('recusa responder chamado ainda em TRIAGEM', async () => {
    repo.findById.mockResolvedValue({
      id: 'x',
      status: StatusChamado.TRIAGEM,
      area: Area.TI,
    });
    await expect(
      useCase.execute('x', dto, atendenteTI),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('primeira resposta inicia o atendimento (ABERTO -> EM_ANDAMENTO) e marca primeiraRespostaEm', async () => {
    repo.findById.mockResolvedValue({
      id: 'x',
      status: StatusChamado.ABERTO,
      area: Area.TI,
      primeiraRespostaEm: null,
    });
    repo.createResponse.mockResolvedValue({ id: 'r1' });
    repo.update.mockResolvedValue({});

    const resposta = await useCase.execute('x', dto, atendenteTI);

    expect(repo.createResponse).toHaveBeenCalledWith('x', 'ti1', dto.texto);
    const patch = repo.update.mock.calls[0][1];
    expect(patch.status).toBe(StatusChamado.EM_ANDAMENTO);
    expect(patch.primeiraRespostaEm).toBeInstanceOf(Date);
    expect(realtime.emitToTenant).toHaveBeenCalledWith(
      't1',
      'ticket:answered',
      expect.objectContaining({ id: 'x', respostaId: 'r1' }),
    );
    expect(resposta.id).toBe('r1');
  });

  it('salva anexo enviado junto da resposta', async () => {
    repo.findById.mockResolvedValue({
      id: 'x',
      status: StatusChamado.EM_ANDAMENTO,
      area: Area.TI,
      primeiraRespostaEm: new Date(),
    });
    repo.createResponse.mockResolvedValue({ id: 'r2' });
    storage.save.mockResolvedValue('t1/responses/r2/laudo.pdf');

    await useCase.execute('x', dto, atendenteTI, [
      {
        originalname: 'laudo.pdf',
        mimetype: 'application/pdf',
        size: 1234,
        buffer: Buffer.from('x'),
      },
    ]);

    expect(storage.save).toHaveBeenCalled();
    expect(repo.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        responseId: 'r2',
        nomeOriginal: 'laudo.pdf',
        mime: 'application/pdf',
        tamanho: 1234,
      }),
    );
  });
});
