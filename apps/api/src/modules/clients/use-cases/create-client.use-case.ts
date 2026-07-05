import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientsRepository } from '../clients.repository';
import { CnpjService } from '../../integrations/cnpj.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { CreateClientDto } from '../dto/create-client.dto';
import { toClientePublico } from '../presenters/client.presenter';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class CreateClientUseCase {
  constructor(
    private readonly repo: ClientsRepository,
    private readonly cnpj: CnpjService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateClientDto, actor: AuthenticatedUser) {
    const cnpj = dto.cnpj.replace(/\D/g, '');

    // Enriquecimento automático via BrasilAPI quando a razão social não é informada.
    const enriched = dto.razaoSocial ? null : await this.cnpj.consultar(cnpj);

    const data = {
      cnpj,
      razaoSocial: dto.razaoSocial ?? enriched?.razaoSocial ?? '',
      nomeFantasia: dto.nomeFantasia ?? enriched?.nomeFantasia,
      email: dto.email,
      telefone: dto.telefone ?? enriched?.telefone,
      cep: dto.cep ?? enriched?.cep,
      logradouro: dto.logradouro ?? enriched?.logradouro,
      numero: dto.numero ?? enriched?.numero,
      complemento: dto.complemento,
      bairro: dto.bairro ?? enriched?.bairro,
      cidade: dto.cidade ?? enriched?.cidade,
      uf: dto.uf ?? enriched?.uf,
    };

    if (!data.razaoSocial) {
      throw new BadRequestException('razaoSocial é obrigatória');
    }

    try {
      const client = await this.repo.create(data);
      await this.audit.registrar({
        acao: AuditAction.CLIENT_CREATED,
        tenantId: actor.tenantId,
        actorId: actor.id,
        entidade: 'Client',
        entidadeId: client.id,
        metadata: { cnpj, razaoSocial: data.razaoSocial },
      });
      return toClientePublico(client);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('já existe um cliente com esse CNPJ');
      }
      throw error;
    }
  }
}
