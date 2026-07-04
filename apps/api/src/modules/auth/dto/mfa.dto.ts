import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class MfaTokenDto {
  @ApiProperty({ example: '123456', description: 'Código TOTP de 6 dígitos' })
  @IsString()
  @Length(6, 6)
  token: string;
}
