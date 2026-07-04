/**
 * Contratos compartilhados entre a API (NestJS) e os frontends (Next.js).
 * Mantém o front e o back falando a mesma língua sem duplicar definições.
 */

export const PAPEIS = [
  'SUPER_ADMIN',
  'ADMIN',
  'TRIAGEM',
  'TI',
  'TRADE',
  'OPERACOES',
  'SOLICITANTE',
] as const;

export type Papel = (typeof PAPEIS)[number];

export const STATUS_CHAMADO = [
  'TRIAGEM',
  'ABERTO',
  'EM_ANDAMENTO',
  'RESOLVIDO',
  'FECHADO',
] as const;

export type StatusChamado = (typeof STATUS_CHAMADO)[number];

export interface UsuarioPublico {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
}
