/**
 * Lógica pura de aplicação do escopo de tenant às queries do Prisma.
 * Isolada da extension para ser testável sem banco (ver tenant-scope.spec.ts).
 */

/** Modelos isolados por tenant. Cresce a cada fase (Ticket, ...). */
export const TENANT_MODELS = new Set<string>(['User', 'Client']);

/** Operações onde injetamos `where.tenantId`. */
const SCOPED_WHERE_OPS = new Set<string>([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
]);

/**
 * Operações proibidas no cliente com escopo para modelos isolados:
 * o `where` do Prisma nesses casos só aceita campos únicos, então não dá para
 * injetar `tenantId` com segurança. Convenção: use findFirst / updateMany /
 * deleteMany com escopo explícito. Falhar aqui é fail-closed (loud, não silent).
 */
const FORBIDDEN_OPS = new Set<string>([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete',
  'upsert',
]);

export class TenantScopeError extends Error {
  constructor(model: string, operation: string) {
    super(
      `Operação "${operation}" não é permitida no modelo isolado "${model}" pelo cliente com escopo de tenant. ` +
        `Use findFirst/updateMany/deleteMany com escopo de tenant.`,
    );
    this.name = 'TenantScopeError';
  }
}

export function isTenantModel(model?: string): boolean {
  return !!model && TENANT_MODELS.has(model);
}

export interface ScopeArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Retorna novos args com o escopo de tenant aplicado. Não muta o argumento.
 * Lança TenantScopeError para operações proibidas em modelos isolados.
 */
export function applyTenantScope(
  model: string,
  operation: string,
  args: ScopeArgs,
  tenantId: string,
): ScopeArgs {
  if (!isTenantModel(model)) return args;

  if (FORBIDDEN_OPS.has(operation)) {
    throw new TenantScopeError(model, operation);
  }

  const next: ScopeArgs = { ...args };

  if (SCOPED_WHERE_OPS.has(operation)) {
    next.where = { ...(next.where ?? {}), tenantId };
  } else if (operation === 'create') {
    next.data = { ...((next.data as Record<string, unknown>) ?? {}), tenantId };
  } else if (operation === 'createMany') {
    const data = next.data;
    next.data = Array.isArray(data)
      ? data.map((registro) => ({ ...registro, tenantId }))
      : { ...((data as Record<string, unknown>) ?? {}), tenantId };
  }

  return next;
}
