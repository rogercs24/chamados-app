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

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { ChangeRoleUseCase } from './use-cases/change-role.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';

@ApiTags('users')
@ApiBearerAuth()
@Roles(Papel.SUPER_ADMIN, Papel.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly changeRole: ChangeRoleUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @ApiOperation({ summary: 'Cria um usuário no tenant' })
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.createUser.execute(dto, actor);
  }

  @ApiOperation({ summary: 'Lista usuários do tenant (paginado)' })
  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.listUsers.execute(query);
  }

  @ApiOperation({ summary: 'Detalha um usuário' })
  @Get(':id')
  get(@Param('id') id: string) {
    return this.getUser.execute(id);
  }

  @ApiOperation({ summary: 'Atualiza nome/status de um usuário' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.updateUser.execute(id, dto, actor);
  }

  @ApiOperation({ summary: 'Altera o papel/permissão de um usuário' })
  @Patch(':id/role')
  role(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.changeRole.execute(id, dto, actor);
  }

  @ApiOperation({ summary: 'Remove (soft-delete) um usuário' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.deleteUser.execute(id, actor);
  }
}
