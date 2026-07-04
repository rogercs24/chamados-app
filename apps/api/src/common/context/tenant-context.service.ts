import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId?: string;
  userId?: string;
  papel?: string;
}

/**
 * Contexto de tenant por requisição, propagado via AsyncLocalStorage.
 * O middleware inicia o escopo; o guard de JWT o preenche após validar o token;
 * a Prisma Extension o lê para isolar as queries. Ponto único de verdade.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run<T>(store: TenantStore, callback: () => T): T {
    return this.als.run(store, callback);
  }

  set(partial: Partial<TenantStore>): void {
    const store = this.als.getStore();
    if (store) Object.assign(store, partial);
  }

  get store(): TenantStore | undefined {
    return this.als.getStore();
  }

  get tenantId(): string | undefined {
    return this.als.getStore()?.tenantId;
  }

  get userId(): string | undefined {
    return this.als.getStore()?.userId;
  }
}
