import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Papel } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

import { ImportJobService } from './import-job.service';
import { parseSpreadsheet } from './spreadsheet.parser';
import { IMPORTS_QUEUE, IMPORT_CLIENTS_JOB } from './imports.constants';

@ApiTags('imports')
@ApiBearerAuth()
@Roles(Papel.SUPER_ADMIN, Papel.ADMIN, Papel.TRADE)
@Controller('imports')
export class ImportsController {
  constructor(
    @InjectQueue(IMPORTS_QUEUE) private readonly queue: Queue,
    private readonly jobs: ImportJobService,
  ) {}

  @ApiOperation({
    summary: 'Importa clientes de uma planilha CSV/XLSX (assíncrono → 202)',
  })
  @ApiConsumes('multipart/form-data')
  @Post('clients')
  @UseInterceptors(FileInterceptor('file'))
  async importClients(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('arquivo é obrigatório (campo "file")');
    }
    const rows = await parseSpreadsheet(file.buffer, file.originalname);
    if (rows.length === 0) {
      throw new BadRequestException(
        'planilha vazia ou sem colunas reconhecidas (esperado: cnpj, razaoSocial, ...)',
      );
    }

    const job = await this.jobs.create({
      tenantId: actor.tenantId,
      tipo: 'clients',
      arquivoNome: file.originalname,
      total: rows.length,
      criadoPor: actor.id,
    });

    await this.queue.add(IMPORT_CLIENTS_JOB, {
      importJobId: job.id,
      tenantId: actor.tenantId,
      rows,
    });

    return { jobId: job.id, total: rows.length, status: job.status };
  }

  @ApiOperation({ summary: 'Consulta o status/progresso de uma importação' })
  @Get(':id')
  status(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.jobs.findByIdOrThrow(id, actor.tenantId);
  }
}
