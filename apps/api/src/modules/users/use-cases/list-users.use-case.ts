import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { toUsuarioPublico } from '../../auth/presenters/user.presenter';
import { paginado } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly repo: UsersRepository) {}

  async execute(query: ListUsersQueryDto) {
    const { data, total } = await this.repo.list({
      page: query.page,
      limit: query.limit,
      search: query.search,
      papel: query.papel,
    });
    return paginado(data.map(toUsuarioPublico), total, query.page, query.limit);
  }
}
