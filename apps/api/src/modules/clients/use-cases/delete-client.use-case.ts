import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from '../clients.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    private readonly repo: ClientsRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: string, actor: AuthenticatedUser) {
    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundException('cliente não encontrado');

    await this.repo.softDelete(id);

    await this.audit.registrar({
      acao: AuditAction.CLIENT_DELETED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Client',
      entidadeId: id,
    });

    return { removido: true };
  }
}
