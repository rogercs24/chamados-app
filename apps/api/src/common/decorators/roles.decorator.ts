import { SetMetadata } from '@nestjs/common';
import { Papel } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe uma rota aos papéis informados (checado pelo RolesGuard). */
export const Roles = (...papeis: Papel[]) => SetMetadata(ROLES_KEY, papeis);
