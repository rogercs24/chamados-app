import { applyTenantScope, isTenantModel, TenantScopeError } from './tenant-scope';

describe('applyTenantScope (isolamento multi-tenant)', () => {
  const tenantId = 'tenant-1';

  it('reconhece modelos isolados', () => {
    expect(isTenantModel('User')).toBe(true);
    expect(isTenantModel('Tenant')).toBe(false);
    expect(isTenantModel(undefined)).toBe(false);
  });

  it('injeta tenantId no where de findMany', () => {
    const r = applyTenantScope('User', 'findMany', { where: { ativo: true } }, tenantId);
    expect(r.where).toEqual({ ativo: true, tenantId });
  });

  it('injeta tenantId no data de create', () => {
    const r = applyTenantScope('User', 'create', { data: { nome: 'x' } }, tenantId);
    expect(r.data).toEqual({ nome: 'x', tenantId });
  });

  it('injeta tenantId em cada item de createMany', () => {
    const r = applyTenantScope(
      'User',
      'createMany',
      { data: [{ nome: 'a' }, { nome: 'b' }] },
      tenantId,
    );
    expect(r.data).toEqual([
      { nome: 'a', tenantId },
      { nome: 'b', tenantId },
    ]);
  });

  it('não altera modelos fora de escopo', () => {
    const args = { where: { id: '1' } };
    expect(applyTenantScope('Tenant', 'findMany', args, tenantId)).toBe(args);
  });

  it('não muta o argumento original (imutabilidade)', () => {
    const args = { where: { ativo: true } };
    applyTenantScope('User', 'findMany', args, tenantId);
    expect(args.where).toEqual({ ativo: true });
  });

  it('lança em operações proibidas (fail-closed)', () => {
    for (const op of ['findUnique', 'update', 'delete', 'upsert']) {
      expect(() => applyTenantScope('User', op, {}, tenantId)).toThrow(
        TenantScopeError,
      );
    }
  });
});
