import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Papel } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { SerieQueryDto } from './dto/serie-query.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Roles(Papel.SUPER_ADMIN, Papel.ADMIN, Papel.TRIAGEM)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @ApiOperation({ summary: 'Resumo: totais por status e tempos médios' })
  @Get('overview')
  overview(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboard.overview(tenantId);
  }

  @ApiOperation({ summary: 'Chamados por área' })
  @Get('por-area')
  porArea(@CurrentUser('tenantId') tenantId: string) {
    return this.dashboard.porArea(tenantId);
  }

  @ApiOperation({
    summary: 'Série temporal de chamados (dia/semana/mês/ano/período)',
  })
  @Get('serie')
  serie(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: SerieQueryDto,
  ) {
    return this.dashboard.serie(tenantId, query);
  }
}
