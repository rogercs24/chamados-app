import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { ChangeRoleUseCase } from './use-cases/change-role.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';

@Module({
  imports: [AuthModule], // PasswordService + TokenService
  controllers: [UsersController],
  providers: [
    UsersRepository,
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    ChangeRoleUseCase,
    DeleteUserUseCase,
  ],
})
export class UsersModule {}
