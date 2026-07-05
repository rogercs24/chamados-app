import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { toUsuarioPublico } from '../../auth/presenters/user.presenter';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly repo: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: string, dto: UpdateUserDto, actor: AuthenticatedUser) {
    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundException('usuário não encontrado');

    const user = await this.repo.update(id, {
      nome: dto.nome,
      ativo: dto.ativo,
    });

    await this.audit.registrar({
      acao: AuditAction.USER_UPDATED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'User',
      entidadeId: id,
      metadata: { nome: dto.nome, ativo: dto.ativo },
    });

    return toUsuarioPublico(user!);
  }
}
