import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { TokenService } from '../../auth/services/token.service';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly repo: UsersRepository,
    private readonly audit: AuditService,
    private readonly tokens: TokenService,
  ) {}

  async execute(id: string, actor: AuthenticatedUser) {
    if (id === actor.id) {
      throw new ForbiddenException('você não pode remover a si mesmo');
    }

    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundException('usuário não encontrado');

    await this.repo.softDelete(id);
    await this.tokens.revokeAllForUser(id);

    await this.audit.registrar({
      acao: AuditAction.USER_DELETED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'User',
      entidadeId: id,
    });

    return { removido: true };
  }
}
