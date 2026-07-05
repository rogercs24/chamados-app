import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2E, E2EContext } from './e2e-setup';

/**
 * Teste de isolamento multi-tenant ponta a ponta (o requisito mais crítico).
 * Dois tenants reais, banco real (Testcontainers). Garante que um tenant nunca
 * lê dados de outro — e que o acesso cruzado retorna 404 (não 403), para não
 * vazar a existência do recurso. Ver ADR-0001 e docs/ARQUITETURA.md §4.
 */
describe('Isolamento multi-tenant (e2e)', () => {
  let ctx: E2EContext;
  let app: INestApplication;

  // Tokens e ids preenchidos no onboarding de cada tenant.
  let tokenA: string;
  let tokenB: string;
  let clienteIdA: string;

  beforeAll(async () => {
    ctx = await setupE2E();
    app = ctx.app;
  }, 180000);

  afterAll(async () => {
    await ctx?.stop();
  });

  it('registra dois tenants independentes (onboarding SUPER_ADMIN)', async () => {
    const respA = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        empresaNome: 'Empresa A',
        nome: 'Admin A',
        email: 'admin@empresa-a.com',
        senha: 'SenhaForte@123',
      })
      .expect(201);

    const respB = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        empresaNome: 'Empresa B',
        nome: 'Admin B',
        email: 'admin@empresa-b.com',
        senha: 'SenhaForte@123',
      })
      .expect(201);

    tokenA = respA.body.accessToken;
    tokenB = respB.body.accessToken;

    expect(tokenA).toBeDefined();
    expect(tokenB).toBeDefined();
    expect(respA.body.usuario.papel).toBe('SUPER_ADMIN');
  });

  it('tenant A cria um cliente', async () => {
    const resp = await request(app.getHttpServer())
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ cnpj: '19131243000197', razaoSocial: 'Cliente Secreto da A' })
      .expect(201);

    clienteIdA = resp.body.id;
    expect(clienteIdA).toBeDefined();
    expect(resp.body.razaoSocial).toBe('Cliente Secreto da A');
  });

  it('tenant A enxerga o próprio cliente na listagem', async () => {
    const resp = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const ids = (resp.body.data ?? resp.body.items ?? resp.body).map(
      (c: { id: string }) => c.id,
    );
    expect(ids).toContain(clienteIdA);
  });

  it('tenant B NÃO enxerga o cliente do tenant A na listagem', async () => {
    const resp = await request(app.getHttpServer())
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const ids = (resp.body.data ?? resp.body.items ?? resp.body).map(
      (c: { id: string }) => c.id,
    );
    expect(ids).not.toContain(clienteIdA);
  });

  it('tenant B acessando o cliente de A por id recebe 404 (não 403)', async () => {
    await request(app.getHttpServer())
      .get(`/api/clients/${clienteIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('sem token, a rota protegida responde 401', async () => {
    await request(app.getHttpServer()).get('/api/clients').expect(401);
  });
});
