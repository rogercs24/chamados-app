import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { toUsuarioPublico } from '../../auth/presenters/user.presenter';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly repo: UsersRepository) {}

  async execute(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('usuário não encontrado');
    return toUsuarioPublico(user);
  }
}
