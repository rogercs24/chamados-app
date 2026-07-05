import { Injectable, NotFoundException } from '@nestjs/common';
import { ImportStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Persiste os jobs de importação usando o PrismaService BASE (sem escopo de
 * tenant): o worker roda fora do contexto de requisição, então o tenantId é
 * sempre informado explicitamente.
 */
@Injectable()
export class ImportJobService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    tenantId: string;
    tipo: string;
    arquivoNome: string;
    total: number;
    criadoPor: string;
  }) {
    return this.prisma.importJob.create({ data });
  }

  setProcessando(id: string) {
    return this.prisma.importJob.update({
      where: { id },
      data: { status: ImportStatus.PROCESSANDO },
    });
  }

  updateProgress(id: string, processados: number, sucesso: number, falhas: number) {
    return this.prisma.importJob.update({
      where: { id },
      data: { processados, sucesso, falhas },
    });
  }

  finish(
    id: string,
    status: ImportStatus,
    sucesso: number,
    falhas: number,
    erros: Prisma.InputJsonValue,
  ) {
    return this.prisma.importJob.update({
      where: { id },
      data: { status, processados: sucesso + falhas, sucesso, falhas, erros },
    });
  }

  async findByIdOrThrow(id: string, tenantId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id, tenantId },
    });
    if (!job) throw new NotFoundException('importação não encontrada');
    return job;
  }
}
