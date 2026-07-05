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
import { podeAtuar } from '../ticket-access';

/** Resposta de atendente/gestão. A primeira resposta inicia o atendimento. */
@Injectable()
export class RespondTicketUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: string, dto: CreateResponseDto, actor: AuthenticatedUser) {
    const ticket = await this.repo.findById(id);
    if (!ticket || !podeAtuar(ticket, actor)) {
      throw new NotFoundException('chamado não encontrado');
    }
    if (ticket.status === StatusChamado.TRIAGEM) {
      throw new BadRequestException('o chamado ainda não foi triado');
    }

    const resposta = await this.repo.createResponse(id, actor.id, dto.texto);

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

    return resposta;
  }
}
