import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusChamado } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    enum: StatusChamado,
    description: 'Novo status (TRIAGEM não é permitido aqui — use a triagem)',
  })
  @IsEnum(StatusChamado)
  status: StatusChamado;
}
