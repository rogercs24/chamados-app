import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from '../clients.repository';
import { toClientePublico } from '../presenters/client.presenter';

@Injectable()
export class GetClientUseCase {
  constructor(private readonly repo: ClientsRepository) {}

  async execute(id: string) {
    const client = await this.repo.findById(id);
    if (!client) throw new NotFoundException('cliente não encontrado');
    return toClientePublico(client);
  }
}
