import { User } from '@prisma/client';

export interface UsuarioPublico {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  mfaEnabled: boolean;
}

/** Remove campos sensíveis (senhaHash, mfaSecret) antes de expor o usuário. */
export function toUsuarioPublico(user: User): UsuarioPublico {
  return {
    id: user.id,
    tenantId: user.tenantId,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    ativo: user.ativo,
    mfaEnabled: user.mfaEnabled,
  };
}
