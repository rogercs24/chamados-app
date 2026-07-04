import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description: 'Refresh token. Opcional se enviado via cookie httpOnly.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
