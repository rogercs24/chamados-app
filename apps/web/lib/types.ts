export type Papel =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TRIAGEM'
  | 'TI'
  | 'TRADE'
  | 'OPERACOES'
  | 'SOLICITANTE';

export type StatusChamado =
  | 'TRIAGEM'
  | 'ABERTO'
  | 'EM_ANDAMENTO'
  | 'RESOLVIDO'
  | 'FECHADO';

export type Area = 'TI' | 'TRADE' | 'OPERACOES' | 'OUTROS';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Usuario {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo?: boolean;
  mfaEnabled?: boolean;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Cliente {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  email?: string | null;
  telefone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

export interface Anexo {
  id: string;
  nomeOriginal: string;
  mime: string;
  tamanho: number;
}

export interface Resposta {
  id: string;
  texto: string;
  autorId: string;
  criadoEm: string;
  anexos?: Anexo[];
}

export interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusChamado;
  prioridade?: Prioridade | null;
  area?: Area | null;
  solicitanteId: string;
  clientId?: string | null;
  criadoEm: string;
  primeiraRespostaEm?: string | null;
  fechadoEm?: string | null;
  respostas?: Resposta[];
}
