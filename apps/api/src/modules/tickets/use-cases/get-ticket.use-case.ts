import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository } from '../tickets.repository';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { podeVer } from '../ticket-access';

@Injectable()
export class GetTicketUseCase {
  constructor(private readonly repo: TicketsRepository) {}

  async execute(id: string, actor: AuthenticatedUser) {
    const ticket = await this.repo.findByIdWithResponses(id);
    // 404 (não 403) quando não pode ver — não revela existência entre áreas.
    if (!ticket || !podeVer(ticket, actor)) {
      throw new NotFoundException('chamado não encontrado');
    }
    return ticket;
  }
}
