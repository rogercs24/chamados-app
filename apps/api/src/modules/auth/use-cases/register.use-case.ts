import { ConflictException, Injectable } from '@nestjs/common';
import { Papel } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { slugify } from '../../../common/utils/slugify';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-actions';
import { PasswordService } from '../services/password.service';
import { RequestMeta, TokenService } from '../services/token.service';
import { RegisterDto } from '../dto/register.dto';
import { toUsuarioPublico } from '../presenters/user.presenter';

/** Onboarding: cria a empresa (tenant) e seu primeiro usuário SUPER_ADMIN. */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: RegisterDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase();

    const existente = await this.prisma.user.findUnique({ where: { email } });
    if (existente) {
      throw new ConflictException('já existe uma conta com esse e-mail');
    }

    const senhaHash = await this.password.hash(dto.senha);
    const slug = await this.gerarSlugUnico(dto.empresaNome);

    const { tenant, user } = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { nome: dto.empresaNome, slug },
      });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          nome: dto.nome,
          email,
          senhaHash,
          papel: Papel.SUPER_ADMIN,
        },
      });
      return { tenant, user };
    });

    await this.audit.registrar({
      acao: AuditAction.TENANT_CREATED,
      tenantId: tenant.id,
      actorId: user.id,
      entidade: 'Tenant',
      entidadeId: tenant.id,
      metadata: { nome: tenant.nome, slug: tenant.slug },
      ...meta,
    });
    await this.audit.registrar({
      acao: AuditAction.USER_CREATED,
      tenantId: tenant.id,
      actorId: user.id,
      entidade: 'User',
      entidadeId: user.id,
      metadata: { papel: user.papel },
      ...meta,
    });

    const tokens = await this.tokens.issuePair(user, meta);
    return { usuario: toUsuarioPublico(user), ...tokens };
  }

  private async gerarSlugUnico(nome: string): Promise<string> {
    const base = slugify(nome);
    let slug = base;
    let sufixo = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${base}-${sufixo++}`;
    }
    return slug;
  }
}
