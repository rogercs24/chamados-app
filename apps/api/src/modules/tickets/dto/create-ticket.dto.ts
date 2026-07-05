import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Sistema fora do ar' })
  @IsString()
  @MinLength(3)
  titulo: string;

  @ApiProperty({ example: 'Não consigo acessar o painel desde as 9h.' })
  @IsString()
  @MinLength(5)
  descricao: string;

  @ApiPropertyOptional({ description: 'Cliente relacionado (opcional)' })
  @IsOptional()
  @IsString()
  clientId?: string;
}
