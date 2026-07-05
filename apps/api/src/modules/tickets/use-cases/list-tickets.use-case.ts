import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TicketsRepository } from '../tickets.repository';
import { ListTicketsQueryDto } from '../dto/list-tickets-query.dto';
import { paginado } from '../../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { isAdminLike, isAtendente, papelToArea } from '../ticket-access';

/**
 * Lista chamados com visibilidade por papel:
 * - gestão/triagem: todos; atendente: sua área; solicitante: os próprios.
 */
@Injectable()
export class ListTicketsUseCase {
  constructor(private readonly repo: TicketsRepository) {}

  async execute(query: ListTicketsQueryDto, actor: AuthenticatedUser) {
    const where: Prisma.TicketWhereInput = {};

    if (isAdminLike(actor.papel)) {
      if (query.area) where.area = query.area;
    } else if (isAtendente(actor.papel)) {
      where.area = papelToArea(actor.papel) ?? undefined;
    } else {
      where.solicitanteId = actor.id;
    }

    if (query.status) where.status = query.status;

    const { data, total } = await this.repo.list(where, query.page, query.limit);
    return paginado(data, total, query.page, query.limit);
  }
}
