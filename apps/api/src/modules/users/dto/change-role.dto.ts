import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Papel } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({ enum: Papel })
  @IsEnum(Papel)
  papel: Papel;
}
