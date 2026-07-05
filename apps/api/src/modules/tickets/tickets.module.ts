import { Module } from '@nestjs/common';
import { FaqModule } from '../faq/faq.module';
import { TicketsController } from './tickets.controller';
import { TicketsRepository } from './tickets.repository';
import { CreateTicketUseCase } from './use-cases/create-ticket.use-case';
import { ListTicketsUseCase } from './use-cases/list-tickets.use-case';
import { GetTicketUseCase } from './use-cases/get-ticket.use-case';
import { TriageTicketUseCase } from './use-cases/triage-ticket.use-case';
import { UpdateStatusUseCase } from './use-cases/update-status.use-case';
import { RespondTicketUseCase } from './use-cases/respond-ticket.use-case';
import { GetAttachmentUseCase } from './use-cases/get-attachment.use-case';
import { DeleteTicketUseCase } from './use-cases/delete-ticket.use-case';

@Module({
  imports: [FaqModule],
  controllers: [TicketsController],
  providers: [
    TicketsRepository,
    CreateTicketUseCase,
    ListTicketsUseCase,
    GetTicketUseCase,
    TriageTicketUseCase,
    UpdateStatusUseCase,
    RespondTicketUseCase,
    GetAttachmentUseCase,
    DeleteTicketUseCase,
  ],
})
export class TicketsModule {}
