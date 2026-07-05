import { Injectable, NotFoundException } from '@nestjs/common';
import { ImportStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ReportJobService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { tenantId: string; tipo: string; criadoPor: string }) {
    return this.prisma.reportJob.create({ data });
  }

  setProcessando(id: string) {
    return this.prisma.reportJob.update({
      where: { id },
      data: { status: ImportStatus.PROCESSANDO },
    });
  }

  finish(id: string, caminho: string, arquivoNome: string) {
    return this.prisma.reportJob.update({
      where: { id },
      data: { status: ImportStatus.CONCLUIDO, caminho, arquivoNome },
    });
  }

  fail(id: string) {
    return this.prisma.reportJob.update({
      where: { id },
      data: { status: ImportStatus.FALHOU },
    });
  }

  async findByIdOrThrow(id: string, tenantId: string) {
    const job = await this.prisma.reportJob.findFirst({
      where: { id, tenantId },
    });
    if (!job) throw new NotFoundException('relatório não encontrado');
    return job;
  }
}
