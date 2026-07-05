import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusChamado } from '@prisma/client';
import { TicketsRepository } from '../tickets.repository';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { RealtimeGateway } from '../../../infra/realtime/realtime.gateway';
import { podeAtuar } from '../ticket-access';

@Injectable()
export class UpdateStatusUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async execute(id: string, dto: UpdateStatusDto, actor: AuthenticatedUser) {
    if (dto.status === StatusChamado.TRIAGEM) {
      throw new BadRequestException('use a triagem para retornar a TRIAGEM');
    }

    const ticket = await this.repo.findById(id);
    if (!ticket || !podeAtuar(ticket, actor)) {
      throw new NotFoundException('chamado não encontrado');
    }

    const atualizado = await this.repo.update(id, {
      status: dto.status,
      fechadoEm:
        dto.status === StatusChamado.FECHADO ? new Date() : ticket.fechadoEm,
    });

    await this.audit.registrar({
      acao: AuditAction.TICKET_STATUS_CHANGED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Ticket',
      entidadeId: id,
      metadata: { de: ticket.status, para: dto.status },
    });

    this.realtime.emitToTenant(actor.tenantId, 'ticket:status', {
      id,
      status: dto.status,
    });

    return atualizado;
  }
}
