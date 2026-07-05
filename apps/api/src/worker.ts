import './instrument'; // Sentry — deve vir antes de tudo
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger as NestLogger } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { AppModule } from './app.module';
import { RealtimeGateway } from './infra/realtime/realtime.gateway';

/**
 * Entrypoint do worker de filas (BullMQ). Sobe o mesmo grafo de módulos da API,
 * porém como *application context* — sem servidor HTTP. Os @Processor (import e
 * relatórios) começam a consumir a fila assim que os módulos carregam.
 *
 * Tempo real a partir do worker: ele não tem servidor Socket.IO próprio, então
 * recebe um `Server` ligado ao MESMO adapter Redis da API. Um evento emitido aqui
 * (ex.: progresso de importação) é publicado no Redis e entregue aos clientes
 * conectados na instância da API — sem o worker precisar aceitar conexões.
 * Ver ADR-0003 (assíncrono) e ADR-0002 (tempo real).
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const subClient = pubClient.duplicate();

  const io = new Server({ cors: { origin: true, credentials: true } });
  io.adapter(createAdapter(pubClient, subClient));

  // Injeta o emissor no gateway para que os processors publiquem eventos.
  app.get(RealtimeGateway).server = io;

  new NestLogger('Worker').log(
    'Worker de filas iniciado — processando importações e relatórios',
  );
}

void bootstrap();
