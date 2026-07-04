import { Prisma } from '@prisma/client';
import { TenantContextService } from '../context/tenant-context.service';
import { applyTenantScope, isTenantModel, ScopeArgs } from './tenant-scope';

/**
 * Extension do Prisma que impõe o isolamento multi-tenant em TODAS as queries
 * de modelos isolados. Fail-closed: sem contexto de tenant, a operação é negada.
 * Este é o ponto único de enforcement (ver ADR-0001).
 */
export function tenantExtension(ctx: TenantContextService) {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-isolation',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!isTenantModel(model)) {
              return query(args);
            }

            const tenantId = ctx.tenantId;
            if (!tenantId) {
              throw new Error(
                `Contexto de tenant ausente para operação "${operation}" em "${model}". ` +
                  `Modelos isolados só podem ser acessados dentro de uma requisição autenticada.`,
              );
            }

            const scoped = applyTenantScope(
              model,
              operation,
              args as ScopeArgs,
              tenantId,
            );
            return query(scoped);
          },
        },
      },
    }),
  );
}
