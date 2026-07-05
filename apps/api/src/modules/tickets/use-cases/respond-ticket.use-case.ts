import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusChamado } from '@prisma/client';
import { TicketsRepository } from '../tickets.repository';
import { CreateResponseDto } from '../dto/create-response.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { RealtimeGateway } from '../../../infra/realtime/realtime.gateway';
import { FileStorageService } from '../../../infra/storage/file-storage.service';
import { podeAtuar } from '../ticket-access';

export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Resposta de atendente/gestão. A primeira resposta inicia o atendimento. */
@Injectable()
export class RespondTicketUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
    private readonly storage: FileStorageService,
  ) {}

  async execute(
    id: string,
    dto: CreateResponseDto,
    actor: AuthenticatedUser,
    arquivos: UploadedFileLike[] = [],
  ) {
    const ticket = await this.repo.findById(id);
    if (!ticket || !podeAtuar(ticket, actor)) {
      throw new NotFoundException('chamado não encontrado');
    }
    if (ticket.status === StatusChamado.TRIAGEM) {
      throw new BadRequestException('o chamado ainda não foi triado');
    }

    const resposta = await this.repo.createResponse(id, actor.id, dto.texto);

    for (const arquivo of arquivos) {
      const caminho = await this.storage.save(
        actor.tenantId,
        `responses/${resposta.id}`,
        arquivo.originalname,
        arquivo.buffer,
      );
      await this.repo.createAttachment({
        responseId: resposta.id,
        nomeOriginal: arquivo.originalname,
        caminho,
        mime: arquivo.mimetype,
        tamanho: arquivo.size,
      });
    }

    const patch: Prisma.TicketUncheckedUpdateManyInput = {};
    if (!ticket.primeiraRespostaEm) patch.primeiraRespostaEm = new Date();
    if (ticket.status === StatusChamado.ABERTO) {
      patch.status = StatusChamado.EM_ANDAMENTO;
    }
    if (Object.keys(patch).length > 0) {
      await this.repo.update(id, patch);
    }

    await this.audit.registrar({
      acao: AuditAction.TICKET_ANSWERED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Ticket',
      entidadeId: id,
    });

    this.realtime.emitToTenant(actor.tenantId, 'ticket:answered', {
      id,
      respostaId: resposta.id,
      autorId: actor.id,
    });

    return resposta;
  }
}
