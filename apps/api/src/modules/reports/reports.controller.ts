import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportStatus, Papel } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { FileStorageService } from '../../infra/storage/file-storage.service';
import { ReportJobService } from './report-job.service';
import { REPORTS_QUEUE, REPORT_TICKETS_JOB } from './reports.constants';

@ApiTags('reports')
@ApiBearerAuth()
@Roles(Papel.SUPER_ADMIN, Papel.ADMIN, Papel.TRIAGEM)
@Controller('reports')
export class ReportsController {
  constructor(
    @InjectQueue(REPORTS_QUEUE) private readonly queue: Queue,
    private readonly jobs: ReportJobService,
    private readonly storage: FileStorageService,
  ) {}

  @ApiOperation({ summary: 'Gera relatório de chamados em XLSX (assíncrono)' })
  @Post('tickets')
  async gerarTickets(@CurrentUser() actor: AuthenticatedUser) {
    const job = await this.jobs.create({
      tenantId: actor.tenantId,
      tipo: 'tickets',
      criadoPor: actor.id,
    });
    await this.queue.add(REPORT_TICKETS_JOB, {
      reportJobId: job.id,
      tenantId: actor.tenantId,
    });
    return { jobId: job.id, status: job.status };
  }

  @ApiOperation({ summary: 'Status de um relatório' })
  @Get(':id')
  status(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.jobs.findByIdOrThrow(id, actor.tenantId);
  }

  @ApiOperation({ summary: 'Baixa o relatório pronto' })
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const job = await this.jobs.findByIdOrThrow(id, actor.tenantId);
    if (job.status !== ImportStatus.CONCLUIDO || !job.caminho) {
      throw new BadRequestException('relatório ainda não está pronto');
    }
    res.download(
      this.storage.absolute(job.caminho),
      job.arquivoNome ?? 'relatorio.xlsx',
    );
  }
}
