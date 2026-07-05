'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useApi } from '../../../lib/use-api';
import { useRealtime } from '../../../lib/socket';
import { useToast } from '../../../components/toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Spinner,
  Textarea,
} from '../../../components/ui';
import {
  PRIORIDADE_COR,
  STATUS_COR,
  STATUS_LABEL,
  dataHora,
} from '../../../lib/format';
import type { Paginated, Ticket } from '../../../lib/types';

export default function ChamadosPage() {
  const { data, loading, recarregar } = useApi<Paginated<Ticket>>(
    '/tickets?limit=50',
  );
  const toast = useToast();
  useRealtime(
    ['ticket:created', 'ticket:triaged', 'ticket:status', 'ticket:answered'],
    recarregar,
  );
  const [abrindo, setAbrindo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await api('/tickets', { method: 'POST', body: { titulo, descricao } });
      toast('Chamado aberto', 'sucesso');
      setTitulo('');
      setDescricao('');
      setAbrindo(false);
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Chamados"
        subtitle="Abertura, triagem e atendimento"
        action={
          <Button onClick={() => setAbrindo((v) => !v)}>
            {abrindo ? 'Cancelar' : 'Novo chamado'}
          </Button>
        }
      />

      {abrindo && (
        <Card className="mb-6 p-5">
          <form onSubmit={criar} className="space-y-4">
            <Field label="Título">
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                minLength={3}
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                minLength={5}
                rows={3}
              />
            </Field>
            <Button type="submit" loading={enviando}>
              Abrir chamado
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState>Nenhum chamado por aqui ainda.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">Aberto em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {t.titulo}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COR[t.status]}>
                      {STATUS_LABEL[t.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.prioridade ? (
                      <Badge className={PRIORIDADE_COR[t.prioridade]}>
                        {t.prioridade}
                      </Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.area ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {dataHora(t.criadoEm)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/chamados/${t.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
