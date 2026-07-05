import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Papel, Prisma } from '@prisma/client';
import { UsersRepository } from '../users.repository';
import { PasswordService } from '../../auth/services/password.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { CreateUserDto } from '../dto/create-user.dto';
import { toUsuarioPublico } from '../../auth/presenters/user.presenter';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly repo: UsersRepository,
    private readonly password: PasswordService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateUserDto, actor: AuthenticatedUser) {
    if (dto.papel === Papel.SUPER_ADMIN && actor.papel !== Papel.SUPER_ADMIN) {
      throw new ForbiddenException(
        'apenas SUPER_ADMIN pode criar outro SUPER_ADMIN',
      );
    }

    const senhaHash = await this.password.hash(dto.senha);

    try {
      const user = await this.repo.create({
        nome: dto.nome,
        email: dto.email.toLowerCase(),
        senhaHash,
        papel: dto.papel,
      });

      await this.audit.registrar({
        acao: AuditAction.USER_CREATED,
        tenantId: actor.tenantId,
        actorId: actor.id,
        entidade: 'User',
        entidadeId: user.id,
        metadata: { papel: user.papel, email: user.email },
      });

      return toUsuarioPublico(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('já existe uma conta com esse e-mail');
      }
      throw error;
    }
  }
}
