import { Inject, Injectable } from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { TENANT_PRISMA, TenantPrisma } from '../../infra/prisma/prisma.module';

export interface ListClientsFilters {
  page: number;
  limit: number;
  search?: string;
}

export type CreateClientData = Omit<
  Prisma.ClientUncheckedCreateInput,
  'id' | 'tenantId' | 'criadoEm' | 'atualizadoEm' | 'deletedAt'
>;

@Injectable()
export class ClientsRepository {
  constructor(@Inject(TENANT_PRISMA) private readonly prisma: TenantPrisma) {}

  private ativos(extra: Prisma.ClientWhereInput = {}): Prisma.ClientWhereInput {
    return { deletedAt: null, ...extra };
  }

  create(data: CreateClientData): Promise<Client> {
    return this.prisma.client.create({
      data: data as unknown as Prisma.ClientCreateInput,
    });
  }

  async list(
    filters: ListClientsFilters,
  ): Promise<{ data: Client[]; total: number }> {
    const where = this.ativos(
      filters.search
        ? {
            OR: [
              { razaoSocial: { contains: filters.search } },
              { nomeFantasia: { contains: filters.search } },
              { cnpj: { contains: filters.search.replace(/\D/g, '') } },
            ],
          }
        : {},
    );

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: this.ativos({ id }) });
  }

  async update(
    id: string,
    data: Prisma.ClientUncheckedUpdateManyInput,
  ): Promise<Client | null> {
    await this.prisma.client.updateMany({ where: this.ativos({ id }), data });
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.client.updateMany({
      where: this.ativos({ id }),
      data: { deletedAt: new Date() },
    });
  }
}
