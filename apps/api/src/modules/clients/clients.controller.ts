import {
  Body,
  Controller,
  Delete,
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

import { CnpjService } from '../integrations/cnpj.service';
import { CepService } from '../integrations/cep.service';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';

import { CreateClientUseCase } from './use-cases/create-client.use-case';
import { ListClientsUseCase } from './use-cases/list-clients.use-case';
import { GetClientUseCase } from './use-cases/get-client.use-case';
import { UpdateClientUseCase } from './use-cases/update-client.use-case';
import { DeleteClientUseCase } from './use-cases/delete-client.use-case';

@ApiTags('clients')
@ApiBearerAuth()
@Roles(Papel.SUPER_ADMIN, Papel.ADMIN, Papel.TRADE)
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly createClient: CreateClientUseCase,
    private readonly listClients: ListClientsUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly updateClient: UpdateClientUseCase,
    private readonly deleteClient: DeleteClientUseCase,
    private readonly cnpj: CnpjService,
    private readonly cep: CepService,
  ) {}

  @ApiOperation({ summary: 'Consulta CNPJ na BrasilAPI (autopreenchimento)' })
  @Get('lookup/cnpj/:cnpj')
  lookupCnpj(@Param('cnpj') cnpj: string) {
    return this.cnpj.consultar(cnpj);
  }

  @ApiOperation({ summary: 'Consulta CEP no ViaCEP (autopreenchimento)' })
  @Get('lookup/cep/:cep')
  lookupCep(@Param('cep') cep: string) {
    return this.cep.consultar(cep);
  }

  @ApiOperation({ summary: 'Cadastra cliente (enriquece via CNPJ se preciso)' })
  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.createClient.execute(dto, actor);
  }

  @ApiOperation({ summary: 'Lista clientes do tenant (paginado)' })
  @Get()
  list(@Query() query: ListClientsQueryDto) {
    return this.listClients.execute(query);
  }

  @ApiOperation({ summary: 'Detalha um cliente' })
  @Get(':id')
  get(@Param('id') id: string) {
    return this.getClient.execute(id);
  }

  @ApiOperation({ summary: 'Atualiza um cliente' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.updateClient.execute(id, dto, actor);
  }

  @ApiOperation({ summary: 'Remove (soft-delete) um cliente' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.deleteClient.execute(id, actor);
  }
}
