import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from '../clients.repository';
import { UpdateClientDto } from '../dto/update-client.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { toClientePublico } from '../presenters/client.presenter';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    private readonly repo: ClientsRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: string, dto: UpdateClientDto, actor: AuthenticatedUser) {
    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundException('cliente não encontrado');

    const client = await this.repo.update(id, {
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia,
      email: dto.email,
      telefone: dto.telefone,
      cep: dto.cep,
      logradouro: dto.logradouro,
      numero: dto.numero,
      complemento: dto.complemento,
      bairro: dto.bairro,
      cidade: dto.cidade,
      uf: dto.uf,
    });

    await this.audit.registrar({
      acao: AuditAction.CLIENT_UPDATED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'Client',
      entidadeId: id,
    });

    return toClientePublico(client!);
  }
}
