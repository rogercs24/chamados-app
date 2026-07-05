import { Controller, Get, Query } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaHealthIndicator } from './prisma.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.prisma.isHealthy('database')]);
  }

  // TEMPORÁRIO: verificação de que o Sentry captura 5xx em produção.
  // Só dispara com o token correto (não abusável). Remover após validar.
  @Public()
  @SkipThrottle()
  @ApiExcludeEndpoint()
  @Get('__sentry-check')
  sentryCheck(@Query('token') token?: string) {
    if (token !== 'verify-9fce84') return { ok: true };
    throw new Error('Sentry verification error — pode ignorar');
  }
}
