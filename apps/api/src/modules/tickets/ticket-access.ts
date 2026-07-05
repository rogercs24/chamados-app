import { Area, Papel, Ticket } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

const PAPEL_AREA: Partial<Record<Papel, Area>> = {
  [Papel.TI]: Area.TI,
  [Papel.TRADE]: Area.TRADE,
  [Papel.OPERACOES]: Area.OPERACOES,
};

/** Área que um papel de atendente atende (null se não for atendente). */
export function papelToArea(papel: Papel): Area | null {
  return PAPEL_AREA[papel] ?? null;
}

/** Enxerga todos os chamados do tenant (gestão/triagem). */
export function isAdminLike(papel: Papel): boolean {
  return (
    papel === Papel.SUPER_ADMIN ||
    papel === Papel.ADMIN ||
    papel === Papel.TRIAGEM
  );
}

export function isAtendente(papel: Papel): boolean {
  return papelToArea(papel) !== null;
}

/** Pode visualizar o chamado? */
export function podeVer(ticket: Ticket, user: AuthenticatedUser): boolean {
  if (isAdminLike(user.papel)) return true;
  if (isAtendente(user.papel)) return ticket.area === papelToArea(user.papel);
  return ticket.solicitanteId === user.id;
}

/** Pode atuar no chamado (responder / mudar status)? */
export function podeAtuar(ticket: Ticket, user: AuthenticatedUser): boolean {
  if (isAdminLike(user.papel)) return true;
  return isAtendente(user.papel) && ticket.area === papelToArea(user.papel);
}
