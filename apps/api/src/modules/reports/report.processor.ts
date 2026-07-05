import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Workbook } from 'exceljs';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { FileStorageService } from '../../infra/storage/file-storage.service';
import { RealtimeGateway } from '../../infra/realtime/realtime.gateway';
import { ReportJobService } from './report-job.service';
import { REPORTS_QUEUE } from './reports.constants';

interface ReportPayload {
  reportJobId: string;
  tenantId: string;
}

/** Gera um relatório XLSX de chamados de forma assíncrona (fora do ciclo HTTP). */
@Processor(REPORTS_QUEUE)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: ReportJobService,
    private readonly storage: FileStorageService,
    private readonly realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<ReportPayload>): Promise<void> {
    const { reportJobId, tenantId } = job.data;
    try {
      await this.jobs.setProcessando(reportJobId);

      const tickets = await this.prisma.ticket.findMany({
        where: { tenantId },
        orderBy: { criadoEm: 'desc' },
      });

      const wb = new Workbook();
      const ws = wb.addWorksheet('Chamados');
      ws.columns = [
        { header: 'ID', key: 'id', width: 26 },
        { header: 'Título', key: 'titulo', width: 30 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Prioridade', key: 'prioridade', width: 12 },
        { header: 'Área', key: 'area', width: 12 },
        { header: 'Aberto em', key: 'criadoEm', width: 20 },
        { header: '1ª resposta', key: 'primeiraRespostaEm', width: 20 },
        { header: 'Fechado em', key: 'fechadoEm', width: 20 },
      ];
      ws.getRow(1).font = { bold: true };
      for (const t of tickets) {
        ws.addRow({
          id: t.id,
          titulo: t.titulo,
          status: t.status,
          prioridade: t.prioridade ?? '',
          area: t.area ?? '',
          criadoEm: t.criadoEm,
          primeiraRespostaEm: t.primeiraRespostaEm ?? '',
          fechadoEm: t.fechadoEm ?? '',
        });
      }

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      const arquivoNome = `chamados-${reportJobId}.xlsx`;
      const caminho = await this.storage.save(
        tenantId,
        'reports',
        arquivoNome,
        buffer,
      );

      await this.jobs.finish(reportJobId, caminho, arquivoNome);
      this.realtime.emitToTenant(tenantId, 'report:done', {
        reportJobId,
        arquivoNome,
        totalLinhas: tickets.length,
      });
      this.logger.log(
        `Relatório ${reportJobId} gerado (${tickets.length} linhas)`,
      );
    } catch (error) {
      await this.jobs.fail(reportJobId);
      this.realtime.emitToTenant(tenantId, 'report:failed', { reportJobId });
      this.logger.error(`Falha no relatório ${reportJobId}: ${String(error)}`);
      throw error;
    }
  }
}
