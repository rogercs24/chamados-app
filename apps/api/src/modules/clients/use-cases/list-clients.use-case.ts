import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '../clients.repository';
import { ListClientsQueryDto } from '../dto/list-clients-query.dto';
import { toClientePublico } from '../presenters/client.presenter';
import { paginado } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class ListClientsUseCase {
  constructor(private readonly repo: ClientsRepository) {}

  async execute(query: ListClientsQueryDto) {
    const { data, total } = await this.repo.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
    return paginado(
      data.map(toClientePublico),
      total,
      query.page,
      query.limit,
    );
  }
}
