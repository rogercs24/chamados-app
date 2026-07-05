import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { TenantContextService } from '../../common/context/tenant-context.service';
import { tenantExtension } from '../../common/prisma/tenant.extension';

/**
 * Token do cliente Prisma COM escopo de tenant (isolamento forçado).
 * Injete-o (`@Inject(TENANT_PRISMA)`) nos repositórios de domínio.
 * Para operações de bootstrap/auth (cross-tenant), use o PrismaService base.
 *
 * Tipado como PrismaClient: o isolamento é aplicado em runtime pela extension;
 * as assinaturas dos delegates permanecem as mesmas.
 */
export const TENANT_PRISMA = Symbol('TENANT_PRISMA');

export type TenantPrisma = PrismaClient;

@Global()
@Module({
  providers: [
    PrismaService,
    TenantContextService,
    {
      provide: TENANT_PRISMA,
      inject: [PrismaService, TenantContextService],
      useFactory: (prisma: PrismaService, ctx: TenantContextService) =>
        prisma.$extends(tenantExtension(ctx)),
    },
  ],
  exports: [PrismaService, TenantContextService, TENANT_PRISMA],
})
export class PrismaModule {}
