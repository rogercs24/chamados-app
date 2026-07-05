import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository } from '../tickets.repository';
import { FileStorageService } from '../../../infra/storage/file-storage.service';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { podeVer } from '../ticket-access';

@Injectable()
export class GetAttachmentUseCase {
  constructor(
    private readonly repo: TicketsRepository,
    private readonly storage: FileStorageService,
  ) {}

  async execute(
    ticketId: string,
    attachmentId: string,
    actor: AuthenticatedUser,
  ) {
    const anexo = await this.repo.findAttachmentById(attachmentId);
    if (!anexo || anexo.response.ticketId !== ticketId) {
      throw new NotFoundException('anexo não encontrado');
    }
    const ticket = await this.repo.findById(ticketId);
    if (!ticket || !podeVer(ticket, actor)) {
      throw new NotFoundException('anexo não encontrado');
    }
    return {
      caminhoAbsoluto: this.storage.absolute(anexo.caminho),
      nomeOriginal: anexo.nomeOriginal,
      mime: anexo.mime,
    };
  }
}
