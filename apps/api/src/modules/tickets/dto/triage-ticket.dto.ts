import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Area, Prioridade } from '@prisma/client';

export class TriageTicketDto {
  @ApiProperty({ enum: Prioridade })
  @IsEnum(Prioridade)
  prioridade: Prioridade;

  @ApiProperty({ enum: Area })
  @IsEnum(Area)
  area: Area;
}
