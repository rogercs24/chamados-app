import { BadRequestException, Injectable } from '@nestjs/common';
import { TicketsRepository } from '../tickets.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { FaqService } from '../../faq/faq.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { RealtimeGateway } from '../../../infra/realtime/realtime.gateway';

/**
 * Abertura de chamado: qualquer usuário autenticado. Entra em TRIAGEM.
 * Exige um faqToken válido — o solicitante precisa ter consultado o FAQ antes.
 */
@Injectable()
export class CreateTicketUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
    private readonly faq: FaqService,
  ) {}

  async execute(dto: CreateTicketDto, actor: AuthenticatedUser) {
    const consulta = await this.faq.validarEConsumir(
      dto.faqToken,
      actor.tenantId,
      actor.id,
    );
    if (!consulta.valido) {
      throw new BadRequestException(
        `consulte o FAQ antes de abrir o chamado (${consulta.motivo}). Descreva o problema novamente para gerar uma nova consulta.`,
      );
    }

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

    this.realtime.emitToTenant(actor.tenantId, 'ticket:created', {
      id: ticket.id,
      titulo: ticket.titulo,
      status: ticket.status,
    });

    return ticket;
  }
}
