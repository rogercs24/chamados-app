import { Client } from '@prisma/client';

export function toClientePublico(client: Client) {
  const { deletedAt: _deletedAt, ...rest } = client;
  return rest;
}
