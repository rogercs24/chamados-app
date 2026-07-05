import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateResponseDto {
  @ApiProperty({ example: 'Estamos verificando o problema.' })
  @IsString()
  @MinLength(1)
  texto: string;
}
