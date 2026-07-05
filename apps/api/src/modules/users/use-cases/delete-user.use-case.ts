import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Papel } from '@prisma/client';
import { UsersRepository } from '../users.repository';

const ADMINS: Papel[] = [Papel.SUPER_ADMIN, Papel.ADMIN];
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

    // Não deixa o tenant ficar sem nenhum administrador.
    if (ADMINS.includes(existente.papel) && (await this.repo.contarAdmins()) <= 1) {
      throw new BadRequestException(
        'não é possível remover o único administrador do tenant',
      );
    }

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
