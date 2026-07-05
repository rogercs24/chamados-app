import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Papel } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'João Atendente' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: 'joao@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;

  @ApiProperty({ enum: Papel, example: Papel.TI })
  @IsEnum(Papel)
  papel: Papel;
}
