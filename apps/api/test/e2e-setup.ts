import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

/**
 * Sobe MySQL + Redis efêmeros (Testcontainers), aplica as migrations e cria a
 * aplicação Nest a partir do AppModule real — o mesmo grafo que roda em produção.
 * Espelha a configuração de main.ts (prefixo /api, ValidationPipe global).
 */
export interface E2EContext {
  app: INestApplication;
  stop: () => Promise<void>;
}

export async function setupE2E(): Promise<E2EContext> {
  const mysql: StartedMySqlContainer = await new MySqlContainer('mysql:8.4')
    .withDatabase('chamados_test')
    .withUsername('chamados')
    .withUserPassword('chamados')
    .start();

  const redis: StartedRedisContainer = await new RedisContainer(
    'redis:7-alpine',
  ).start();

  const databaseUrl = mysql.getConnectionUri();
  const redisUrl = redis.getConnectionUrl();

  // Env necessária ANTES de instanciar o AppModule (ConfigModule valida no boot).
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.JWT_ACCESS_SECRET = 'e2e-access-secret-0123456789';
  process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-0123456789';

  // Aplica o schema no banco efêmero.
  execSync('pnpm exec prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'ignore',
  });

  // Importado após a env estar setada.
  const { AppModule } = await import('../src/app.module');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const stop = async (): Promise<void> => {
    await app.close();
    await redis.stop();
    await mysql.stop();
  };

  return { app, stop };
}
