import * as Sentry from '@sentry/nestjs';

/**
 * Inicialização do Sentry (observabilidade de erros/performance).
 * DEVE ser importado ANTES de qualquer outro módulo (auto-instrumentação de http,
 * express, etc.). Sem `SENTRY_DSN` configurado, é um no-op — zero impacto em dev.
 */
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    // Amostragem de tracing (0 = desligado). Ajuste conforme volume.
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : 0,
  });
}
