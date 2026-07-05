'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useApi } from '../../../../lib/use-api';
import { useAuth } from '../../../../lib/auth';
import { useToast } from '../../../../components/toast';
import { baixarArquivo } from '../../../../lib/download';
import {
  Badge,
  Button,
  Card,
  Field,
  Select,
  Spinner,
  Textarea,
} from '../../../../components/ui';
import {
  PRIORIDADE_COR,
  STATUS_COR,
  STATUS_LABEL,
  dataHora,
} from '../../../../lib/format';
import { podeAtuar, podeTriar } from '../../../../lib/roles';
import type { Ticket } from '../../../../lib/types';

const AREAS = ['TI', 'TRADE', 'OPERACOES', 'OUTROS'];
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const ACOES_STATUS = ['EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO'] as const;

export default function ChamadoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const { data: ticket, loading, recarregar } = useApi<Ticket>(`/tickets/${id}`);

  const [prioridade, setPrioridade] = useState('MEDIA');
  const [area, setArea] = useState('TI');
  const [texto, setTexto] = useState('');
  const [arquivos, setArquivos] = useState<FileList | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (loading || !user) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }
  if (!ticket) return <p className="text-slate-500">Chamado não encontrado.</p>;

  const atuar = podeAtuar(ticket.area, user.papel);
  const emTriagem = ticket.status === 'TRIAGEM';

  async function triar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/tickets/${id}/triagem`, {
        method: 'PATCH',
        body: { prioridade, area },
      });
      toast('Chamado triado', 'sucesso');
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  async function responder(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('texto', texto);
      if (arquivos) Array.from(arquivos).forEach((f) => fd.append('files', f));
      await api(`/tickets/${id}/responses`, { method: 'POST', body: fd });
      toast('Resposta enviada', 'sucesso');
      setTexto('');
      setArquivos(null);
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setEnviando(false);
    }
  }

  async function mudarStatus(status: string) {
    try {
      await api(`/tickets/${id}/status`, { method: 'PATCH', body: { status } });
      toast('Status atualizado', 'sucesso');
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/chamados" className="text-sm text-slate-500 hover:text-slate-800">
        ← Voltar
      </Link>

      <div className="mt-2 mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{ticket.titulo}</h1>
        <Badge className={STATUS_COR[ticket.status]}>
          {STATUS_LABEL[ticket.status]}
        </Badge>
      </div>

      <Card className="mb-6 p-5">
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {ticket.descricao}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Aberto: {dataHora(ticket.criadoEm)}</span>
          {ticket.prioridade && (
            <Badge className={PRIORIDADE_COR[ticket.prioridade]}>
              {ticket.prioridade}
            </Badge>
          )}
          {ticket.area && <span>Área: {ticket.area}</span>}
        </div>
      </Card>

      {emTriagem && podeTriar(user.papel) && (
        <Card className="mb-6 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Triagem</h3>
          <form onSubmit={triar} className="flex flex-wrap items-end gap-3">
            <Field label="Prioridade">
              <Select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                {PRIORIDADES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="Área">
              <Select value={area} onChange={(e) => setArea(e.target.value)}>
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Encaminhar</Button>
          </form>
        </Card>
      )}

      {atuar && !emTriagem && (
        <div className="mb-6 flex flex-wrap gap-2">
          {ACOES_STATUS.map((s) => (
            <Button
              key={s}
              variant="secondary"
              onClick={() => mudarStatus(s)}
              disabled={ticket.status === s}
            >
              {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      )}

      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Respostas ({ticket.respostas?.length ?? 0})
      </h3>
      <div className="space-y-3">
        {(ticket.respostas ?? []).map((r) => (
          <Card key={r.id} className="p-4">
            <div className="mb-1 text-xs text-slate-400">{dataHora(r.criadoEm)}</div>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{r.texto}</p>
            {r.anexos && r.anexos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.anexos.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      baixarArquivo(
                        `/tickets/${id}/attachments/${a.id}`,
                        a.nomeOriginal,
                      )
                    }
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  >
                    📎 {a.nomeOriginal}
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
        {(ticket.respostas?.length ?? 0) === 0 && (
          <p className="text-sm text-slate-400">Ainda sem respostas.</p>
        )}
      </div>

      {atuar && !emTriagem && (
        <Card className="mt-6 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Responder</h3>
          <form onSubmit={responder} className="space-y-3">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
              rows={3}
              placeholder="Escreva sua resposta…"
            />
            <input
              type="file"
              multiple
              onChange={(e) => setArquivos(e.target.files)}
              className="block text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 hover:file:bg-slate-200"
            />
            <Button type="submit" loading={enviando}>
              Enviar resposta
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
