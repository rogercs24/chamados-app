import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusChamado } from '@prisma/client';
import { TicketsRepository } from '../tickets.repository';
import { TriageTicketDto } from '../dto/triage-ticket.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

/** Triagem (gestão): define prioridade + área e abre o chamado. */
@Injectable()
export class TriageTicketUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: string, dto: TriageTicketDto, actor: AuthenticatedUser) {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw new NotFoundException('chamado não encontrado');
    if (ticket.status !== StatusChamado.TRIAGEM) {
      throw new BadRequestException('chamado já foi triado');
    }

    const atualizado = await this.repo.update(id, {
      prioridade: dto.prioridade,
      area: dto.area,
      status: StatusChamado.ABERTO,
    });

    await this.audit.registrar({
      acao: AuditAction.TICKET_TRIAGED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Ticket',
      entidadeId: id,
      metadata: { prioridade: dto.prioridade, area: dto.area },
    });

    return atualizado;
  }
}
