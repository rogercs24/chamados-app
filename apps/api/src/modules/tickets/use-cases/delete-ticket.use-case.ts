import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository } from '../tickets.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { RealtimeGateway } from '../../../infra/realtime/realtime.gateway';

/** Exclusão de chamado (gestão). Respostas e anexos caem por cascade. */
@Injectable()
export class DeleteTicketUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async execute(id: string, actor: AuthenticatedUser) {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw new NotFoundException('chamado não encontrado');

    await this.repo.delete(id);

    await this.audit.registrar({
      acao: AuditAction.TICKET_DELETED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Ticket',
      entidadeId: id,
      metadata: { titulo: ticket.titulo },
    });

    this.realtime.emitToTenant(actor.tenantId, 'ticket:deleted', { id });

    return { removido: true };
  }
}
