import { Inject, Injectable } from '@nestjs/common';
import { Papel, Prisma, User } from '@prisma/client';
import { TENANT_PRISMA, TenantPrisma } from '../../infra/prisma/prisma.module';

export interface ListUsersFilters {
  page: number;
  limit: number;
  search?: string;
  papel?: Papel;
}

/** Tipo de criação sem tenantId — a Prisma Extension injeta o escopo. */
export type CreateUserData = {
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
};

/**
 * Repositório de usuários sobre o cliente Prisma COM escopo de tenant.
 * Todas as queries são automaticamente filtradas/carimbadas por tenantId.
 * Convenção (ADR-0001): usar findFirst/updateMany (nunca findUnique/update por id).
 */
@Injectable()
export class UsersRepository {
  constructor(@Inject(TENANT_PRISMA) private readonly prisma: TenantPrisma) {}

  private ativos(extra: Prisma.UserWhereInput = {}): Prisma.UserWhereInput {
    return { deletedAt: null, ...extra };
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: data as unknown as Prisma.UserCreateInput,
    });
  }

  async list(
    filters: ListUsersFilters,
  ): Promise<{ data: User[]; total: number }> {
    const where = this.ativos({
      ...(filters.papel ? { papel: filters.papel } : {}),
      ...(filters.search
        ? {
            OR: [
              { nome: { contains: filters.search } },
              { email: { contains: filters.search } },
            ],
          }
        : {}),
    });

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: this.ativos({ id }) });
  }

  async update(
    id: string,
    data: Prisma.UserUncheckedUpdateManyInput,
  ): Promise<User | null> {
    await this.prisma.user.updateMany({ where: this.ativos({ id }), data });
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: this.ativos({ id }),
      data: { ativo: false, deletedAt: new Date() },
    });
  }
}
