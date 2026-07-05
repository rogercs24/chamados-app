import './instrument'; // Sentry — deve vir antes de tudo
import 'reflect-metadata';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './infra/realtime/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger estruturado (Pino) como logger da aplicação
  app.useLogger(app.get(Logger));

  // Segurança de base
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });

  // Prefixo /api para tudo, exceto o health check
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Validação global de DTOs (Fase 1+ usa isso intensamente)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Socket.IO com adapter Redis (tempo real escalável)
  const redisAdapter = new RedisIoAdapter(
    app,
    process.env.REDIS_URL ?? 'redis://localhost:6379',
  );
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  // Documentação OpenAPI/Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chamados SaaS API')
    .setDescription('API multi-tenant de gestão de chamados')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // API_PORT tem prioridade; PORT é o padrão de PaaS (Railway etc.); 3333 no dev.
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3333);
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`API rodando em http://localhost:${port}`);
  logger.log(`Swagger em http://localhost:${port}/docs`);
}

void bootstrap();
