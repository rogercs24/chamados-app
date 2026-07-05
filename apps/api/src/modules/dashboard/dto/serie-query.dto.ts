import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum Granularidade {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class SerieQueryDto {
  @ApiPropertyOptional({ enum: Granularidade, default: Granularidade.DAY })
  @IsOptional()
  @IsEnum(Granularidade)
  granularidade: Granularidade = Granularidade.DAY;

  @ApiPropertyOptional({ description: 'Data inicial (ISO). Padrão: 12 meses atrás' })
  @IsOptional()
  @IsDateString()
  de?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO). Padrão: agora' })
  @IsOptional()
  @IsDateString()
  ate?: string;
}
