import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { RespondTicketUseCase } from './use-cases/respond-ticket.use-case';

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

  @ApiOperation({ summary: 'Responde o chamado (atendente da área ou gestão)' })
  @Post(':id/responses')
  respond(
    @Param('id') id: string,
    @Body() dto: CreateResponseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.respondTicket.execute(id, dto, actor);
  }
}
