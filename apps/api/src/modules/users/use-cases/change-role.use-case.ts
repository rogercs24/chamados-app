import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Papel } from '@prisma/client';
import { UsersRepository } from '../users.repository';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { TokenService } from '../../auth/services/token.service';
import { toUsuarioPublico } from '../../auth/presenters/user.presenter';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class ChangeRoleUseCase {
  constructor(
    private readonly repo: UsersRepository,
    private readonly audit: AuditService,
    private readonly tokens: TokenService,
  ) {}

  async execute(id: string, dto: ChangeRoleDto, actor: AuthenticatedUser) {
    if (id === actor.id) {
      throw new ForbiddenException('você não pode alterar o próprio papel');
    }
    if (dto.papel === Papel.SUPER_ADMIN && actor.papel !== Papel.SUPER_ADMIN) {
      throw new ForbiddenException('apenas SUPER_ADMIN pode conceder SUPER_ADMIN');
    }

    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundException('usuário não encontrado');

    const papelAnterior = existente.papel;
    const user = await this.repo.update(id, { papel: dto.papel });

    // Mudança de permissão encerra as sessões ativas (força re-login).
    await this.tokens.revokeAllForUser(id);

    await this.audit.registrar({
      acao: AuditAction.PERMISSION_CHANGED,
      tenantId: actor.tenantId,
      actorId: actor.id,
      entidade: 'User',
      entidadeId: id,
      metadata: { de: papelAnterior, para: dto.papel },
    });

    return toUsuarioPublico(user!);
  }
}
