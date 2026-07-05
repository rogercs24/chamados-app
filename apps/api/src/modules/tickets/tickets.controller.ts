import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Papel } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

import { CreateTicketDto } from './dto/create-ticket.dto';
import { TriageTicketDto } from './dto/triage-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateResponseDto } from './dto/create-response.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';

import { CreateTicketUseCase } from './use-cases/create-ticket.use-case';
import { ListTicketsUseCase } from './use-cases/list-tickets.use-case';
import { GetTicketUseCase } from './use-cases/get-ticket.use-case';
import { TriageTicketUseCase } from './use-cases/triage-ticket.use-case';
import { UpdateStatusUseCase } from './use-cases/update-status.use-case';
import {
  RespondTicketUseCase,
  UploadedFileLike,
} from './use-cases/respond-ticket.use-case';
import { GetAttachmentUseCase } from './use-cases/get-attachment.use-case';
import { DeleteTicketUseCase } from './use-cases/delete-ticket.use-case';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly createTicket: CreateTicketUseCase,
    private readonly listTickets: ListTicketsUseCase,
    private readonly getTicket: GetTicketUseCase,
    private readonly triageTicket: TriageTicketUseCase,
    private readonly updateStatus: UpdateStatusUseCase,
    private readonly respondTicket: RespondTicketUseCase,
    private readonly getAttachment: GetAttachmentUseCase,
    private readonly deleteTicket: DeleteTicketUseCase,
  ) {}

  @ApiOperation({ summary: 'Abre um chamado (entra em triagem)' })
  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.createTicket.execute(dto, actor);
  }

  @ApiOperation({ summary: 'Lista chamados conforme o papel do usuário' })
  @Get()
  list(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.listTickets.execute(query, actor);
  }

  @ApiOperation({ summary: 'Detalha um chamado com o histórico de respostas' })
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.getTicket.execute(id, actor);
  }

  @ApiOperation({ summary: 'Triagem: define prioridade e área (abre o chamado)' })
  @Roles(Papel.SUPER_ADMIN, Papel.ADMIN, Papel.TRIAGEM)
  @Patch(':id/triagem')
  triage(
    @Param('id') id: string,
    @Body() dto: TriageTicketDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.triageTicket.execute(id, dto, actor);
  }

  @ApiOperation({ summary: 'Altera o status (atendente da área ou gestão)' })
  @Patch(':id/status')
  status(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.updateStatus.execute(id, dto, actor);
  }

  @ApiOperation({
    summary: 'Responde o chamado com texto e anexos (atendente da área ou gestão)',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @Post(':id/responses')
  @UseInterceptors(
    FilesInterceptor('files', 5, { limits: { fileSize: 15 * 1024 * 1024 } }),
  )
  respond(
    @Param('id') id: string,
    @Body() dto: CreateResponseDto,
    @UploadedFiles() files: UploadedFileLike[] | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.respondTicket.execute(id, dto, actor, files ?? []);
  }

  @ApiOperation({ summary: 'Exclui um chamado (gestão)' })
  @Roles(Papel.SUPER_ADMIN, Papel.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    await this.deleteTicket.execute(id, actor);
  }

  @ApiOperation({ summary: 'Baixa um anexo de resposta (com verificação de acesso)' })
  @Get(':ticketId/attachments/:attachmentId')
  async downloadAttachment(
    @Param('ticketId') ticketId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const anexo = await this.getAttachment.execute(
      ticketId,
      attachmentId,
      actor,
    );
    res.download(anexo.caminhoAbsoluto, anexo.nomeOriginal);
  }
}
