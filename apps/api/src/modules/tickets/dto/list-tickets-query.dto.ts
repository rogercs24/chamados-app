import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Area, StatusChamado } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StatusChamado })
  @IsOptional()
  @IsEnum(StatusChamado)
  status?: StatusChamado;

  @ApiPropertyOptional({ enum: Area, description: 'Filtro por área (gestão)' })
  @IsOptional()
  @IsEnum(Area)
  area?: Area;
}
