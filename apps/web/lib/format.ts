import type { Papel, Prioridade, StatusChamado } from './types';

export function dataHora(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function duracao(segundos?: number | null): string {
  if (segundos == null) return '—';
  if (segundos < 60) return `${Math.round(segundos)}s`;
  const min = Math.round(segundos / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return `${h}h${m ? ` ${m}min` : ''}`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export const STATUS_LABEL: Record<StatusChamado, string> = {
  TRIAGEM: 'Triagem',
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
};

export const STATUS_COR: Record<StatusChamado, string> = {
  TRIAGEM: 'bg-amber-100 text-amber-800',
  ABERTO: 'bg-blue-100 text-blue-800',
  EM_ANDAMENTO: 'bg-indigo-100 text-indigo-800',
  RESOLVIDO: 'bg-emerald-100 text-emerald-800',
  FECHADO: 'bg-slate-200 text-slate-700',
};

export const PRIORIDADE_COR: Record<Prioridade, string> = {
  BAIXA: 'bg-slate-100 text-slate-700',
  MEDIA: 'bg-sky-100 text-sky-800',
  ALTA: 'bg-orange-100 text-orange-800',
  URGENTE: 'bg-red-100 text-red-800',
};

export const PAPEL_LABEL: Record<Papel, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  TRIAGEM: 'Triagem',
  TI: 'TI',
  TRADE: 'Trade',
  OPERACOES: 'Operações',
  SOLICITANTE: 'Solicitante',
};
