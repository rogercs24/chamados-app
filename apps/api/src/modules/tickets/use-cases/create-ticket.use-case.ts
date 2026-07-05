import { Injectable } from '@nestjs/common';
import { TicketsRepository } from '../tickets.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

/** Abertura de chamado: qualquer usuário autenticado. Entra em TRIAGEM. */
@Injectable()
export class CreateTicketUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateTicketDto, actor: AuthenticatedUser) {
    const ticket = await this.repo.create({
      titulo: dto.titulo,
      descricao: dto.descricao,
      solicitanteId: actor.id,
      clientId: dto.clientId,
    });

    await this.audit.registrar({
      acao: AuditAction.TICKET_CREATED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Ticket',
      entidadeId: ticket.id,
      metadata: { titulo: ticket.titulo },
    });

    return ticket;
  }
}
