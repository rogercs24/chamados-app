import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'maria@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SenhaForte@123' })
  @IsString()
  @MinLength(1)
  senha: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Código TOTP de 6 dígitos (obrigatório se MFA estiver ativo)',
  })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}
