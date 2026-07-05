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

interface FaqItem {
  categoria: string;
  pergunta: string;
  resposta: string;
}

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
  // Passo 1 — consulta obrigatória ao FAQ
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [faqToken, setFaqToken] = useState<string | null>(null);
  const [faqItens, setFaqItens] = useState<FaqItem[]>([]);
  // Passo 2 — abertura do chamado
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  function resetar() {
    setTermo('');
    setFaqToken(null);
    setFaqItens([]);
    setTitulo('');
    setDescricao('');
    setAbrindo(false);
  }

  async function consultarFaq(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    try {
      const r = await api<{ faqToken: string; itens: FaqItem[] }>(
        '/faq/consultar',
        { method: 'POST', body: { termo } },
      );
      setFaqToken(r.faqToken);
      setFaqItens(r.itens);
      setTitulo(termo);
      setDescricao(termo);
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setBuscando(false);
    }
  }

  async function abrirChamado(e: React.FormEvent) {
    e.preventDefault();
    if (!faqToken) return;
    setEnviando(true);
    try {
      await api('/tickets', {
        method: 'POST',
        body: { titulo, descricao, faqToken },
      });
      toast('Chamado aberto', 'sucesso');
      resetar();
      recarregar();
    } catch (err) {
      // Token consumido/expirado → volta ao passo 1 para nova consulta.
      setFaqToken(null);
      setFaqItens([]);
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
          <Button onClick={() => (abrindo ? resetar() : setAbrindo(true))}>
            {abrindo ? 'Cancelar' : 'Novo chamado'}
          </Button>
        }
      />

      {abrindo && (
        <Card className="mb-6 p-5">
          {/* Passo 1 — consulta ao FAQ (obrigatória) */}
          <form onSubmit={consultarFaq} className="space-y-3">
            <Field
              label="1. Descreva seu problema"
              hint="Antes de abrir um chamado, consulte a base de conhecimento."
            >
              <div className="flex gap-2">
                <Input
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  required
                  minLength={3}
                  placeholder="ex.: como anexo o CT-e"
                />
                <Button type="submit" loading={buscando} className="shrink-0">
                  Buscar no FAQ
                </Button>
              </div>
            </Field>
          </form>

          {/* Resultados do FAQ + passo 2 */}
          {faqToken && (
            <div className="mt-5 space-y-4">
              {faqItens.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Isto pode resolver seu problema:
                  </p>
                  {faqItens.map((f, i) => (
                    <details
                      key={i}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <summary className="cursor-pointer text-sm font-medium text-slate-800">
                        {f.pergunta}
                      </summary>
                      <p className="mt-2 text-sm text-slate-600">{f.resposta}</p>
                      <span className="mt-1 block text-xs text-slate-400">
                        {f.categoria}
                      </span>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Nenhuma resposta no FAQ para esse termo.
                </p>
              )}

              <form
                onSubmit={abrirChamado}
                className="space-y-4 border-t border-slate-200 pt-4"
              >
                <p className="text-sm font-medium text-slate-700">
                  2. Não resolveu? Abra o chamado
                </p>
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
            </div>
          )}
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
                      className="font-medium text-[#5a8a2c] hover:underline"
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
