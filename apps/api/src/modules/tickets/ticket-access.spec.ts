import { Area, Papel, Ticket } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  isAdminLike,
  isAtendente,
  papelToArea,
  podeAtuar,
  podeVer,
} from './ticket-access';

const ticketTI = { area: Area.TI, solicitanteId: 'sol1' } as Ticket;
const user = (papel: Papel, id: string): AuthenticatedUser =>
  ({ papel, id, tenantId: 't1', email: 'x@x.com', nome: 'X' });

describe('ticket-access (visibilidade por papel/área)', () => {
  it('mapeia papel de atendente para área', () => {
    expect(papelToArea(Papel.TI)).toBe(Area.TI);
    expect(papelToArea(Papel.TRADE)).toBe(Area.TRADE);
    expect(papelToArea(Papel.ADMIN)).toBeNull();
  });

  it('classifica gestão e atendente', () => {
    expect(isAdminLike(Papel.ADMIN)).toBe(true);
    expect(isAdminLike(Papel.TRIAGEM)).toBe(true);
    expect(isAdminLike(Papel.TI)).toBe(false);
    expect(isAtendente(Papel.TI)).toBe(true);
    expect(isAtendente(Papel.SOLICITANTE)).toBe(false);
  });

  it('gestão vê e atua em qualquer chamado', () => {
    const admin = user(Papel.ADMIN, 'a');
    expect(podeVer(ticketTI, admin)).toBe(true);
    expect(podeAtuar(ticketTI, admin)).toBe(true);
  });

  it('atendente só vê/atua na própria área', () => {
    expect(podeVer(ticketTI, user(Papel.TI, 't'))).toBe(true);
    expect(podeAtuar(ticketTI, user(Papel.TI, 't'))).toBe(true);
    expect(podeVer(ticketTI, user(Papel.TRADE, 'tr'))).toBe(false);
    expect(podeAtuar(ticketTI, user(Papel.TRADE, 'tr'))).toBe(false);
  });

  it('solicitante só vê o próprio chamado e não atua', () => {
    expect(podeVer(ticketTI, user(Papel.SOLICITANTE, 'sol1'))).toBe(true);
    expect(podeVer(ticketTI, user(Papel.SOLICITANTE, 'sol2'))).toBe(false);
    expect(podeAtuar(ticketTI, user(Papel.SOLICITANTE, 'sol1'))).toBe(false);
  });
});
