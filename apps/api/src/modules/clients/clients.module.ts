import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ClientsController } from './clients.controller';
import { ClientsRepository } from './clients.repository';
import { CreateClientUseCase } from './use-cases/create-client.use-case';
import { ListClientsUseCase } from './use-cases/list-clients.use-case';
import { GetClientUseCase } from './use-cases/get-client.use-case';
import { UpdateClientUseCase } from './use-cases/update-client.use-case';
import { DeleteClientUseCase } from './use-cases/delete-client.use-case';

@Module({
  imports: [IntegrationsModule],
  controllers: [ClientsController],
  providers: [
    ClientsRepository,
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
})
export class ClientsModule {}
