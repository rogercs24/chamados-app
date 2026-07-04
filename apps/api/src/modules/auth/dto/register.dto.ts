import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Empresa Acme', description: 'Nome da empresa (tenant)' })
  @IsString()
  @MinLength(2)
  empresaNome: string;

  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: 'maria@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaForte@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;
}
