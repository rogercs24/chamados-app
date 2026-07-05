import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConsultarFaqDto {
  @ApiProperty({
    example: 'como anexo o cte',
    description: 'Termo/descrição do problema (mín. 3 caracteres)',
  })
  @IsString()
  @MinLength(3)
  termo: string;
}
