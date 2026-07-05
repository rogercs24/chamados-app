import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

/** Todos os campos opcionais (menos restrições que o create). */
export class UpdateClientDto extends PartialType(CreateClientDto) {}
