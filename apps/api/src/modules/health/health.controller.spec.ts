import { Test } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn((checks) => ({ status: 'ok', checks })) },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }) },
        },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve executar a verificação de saúde', () => {
    const resultado = controller.check();
    expect(resultado).toHaveProperty('status', 'ok');
  });
});
