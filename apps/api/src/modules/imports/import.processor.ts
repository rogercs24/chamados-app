import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ImportStatus, Prisma } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RealtimeGateway } from '../../infra/realtime/realtime.gateway';
import { ImportJobService } from './import-job.service';
import { ClientRow } from './spreadsheet.parser';
import { IMPORTS_QUEUE } from './imports.constants';

interface ImportClientsPayload {
  importJobId: string;
  tenantId: string;
  rows: ClientRow[];
}

/**
 * Worker que consome a fila de importação. Roda fora do ciclo HTTP; grava com
 * tenantId explícito e emite progresso em tempo real via Socket.IO.
 */
@Processor(IMPORTS_QUEUE)
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: ImportJobService,
    private readonly realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<ImportClientsPayload>): Promise<void> {
    const { importJobId, tenantId, rows } = job.data;
    await this.jobs.setProcessando(importJobId);

    let sucesso = 0;
    let falhas = 0;
    const erros: { linha: number; erro: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const cnpj = (row.cnpj ?? '').replace(/\D/g, '');
        if (cnpj.length !== 14) throw new Error('CNPJ inválido');
        if (!row.razaoSocial) throw new Error('razaoSocial vazia');

        await this.prisma.client.create({
          data: {
            tenantId,
            cnpj,
            razaoSocial: row.razaoSocial,
            nomeFantasia: row.nomeFantasia,
            email: row.email,
            telefone: row.telefone,
            cep: row.cep?.replace(/\D/g, ''),
            cidade: row.cidade,
            uf: row.uf,
          },
        });
        sucesso++;
      } catch (error) {
        falhas++;
        const duplicado =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';
        erros.push({
          linha: i + 2, // +1 cabeçalho, +1 base-1
          erro: duplicado ? 'CNPJ duplicado' : (error as Error).message,
        });
      }

      if ((i + 1) % 5 === 0 || i === rows.length - 1) {
        await this.jobs.updateProgress(importJobId, i + 1, sucesso, falhas);
        this.realtime.emitToTenant(tenantId, 'import:progress', {
          importJobId,
          processados: i + 1,
          total: rows.length,
          sucesso,
          falhas,
        });
      }
    }

    await this.jobs.finish(
      importJobId,
      ImportStatus.CONCLUIDO,
      sucesso,
      falhas,
      erros.slice(0, 100),
    );
    this.realtime.emitToTenant(tenantId, 'import:done', {
      importJobId,
      sucesso,
      falhas,
    });
    this.logger.log(
      `Importação ${importJobId} concluída: ${sucesso} ok, ${falhas} falhas`,
    );
  }
}
