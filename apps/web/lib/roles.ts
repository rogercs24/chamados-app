import type { Area, Papel } from './types';

export function isAdminLike(papel: Papel): boolean {
  return papel === 'SUPER_ADMIN' || papel === 'ADMIN' || papel === 'TRIAGEM';
}

const MAP: Partial<Record<Papel, Area>> = {
  TI: 'TI',
  TRADE: 'TRADE',
  OPERACOES: 'OPERACOES',
};

export function papelToArea(papel: Papel): Area | null {
  return MAP[papel] ?? null;
}

export function podeTriar(papel: Papel): boolean {
  return isAdminLike(papel);
}

export function podeAtuar(area: Area | null | undefined, papel: Papel): boolean {
  if (isAdminLike(papel)) return true;
  const a = papelToArea(papel);
  return a != null && a === area;
}
