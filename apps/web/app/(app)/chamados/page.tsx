'use client';

import { useEffect, useState } from 'react';
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
    [
      'ticket:created',
      'ticket:triaged',
      'ticket:status',
      'ticket:answered',
      'ticket:deleted',
    ],
    recarregar,
  );

  const [abrindo, setAbrindo] = useState(false);
  const [solicitacao, setSolicitacao] = useState('');
  const [faqItens, setFaqItens] = useState<FaqItem[]>([]);
  const [enviando, setEnviando] = useState(false);

  // Busca o FAQ automaticamente enquanto a pessoa descreve a solicitação.
  useEffect(() => {
    const termo = solicitacao.trim();
    if (termo.length < 3) {
      setFaqItens([]);
      return;
    }
    const h = setTimeout(async () => {
      try {
        const itens = await api<FaqItem[]>(
          `/faq?termo=${encodeURIComponent(termo)}`,
        );
        setFaqItens(itens);
      } catch {
        /* silencioso — a busca é auxiliar */
      }
    }, 400);
    return () => clearTimeout(h);
  }, [solicitacao]);

  function resetar() {
    setSolicitacao('');
    setFaqItens([]);
    setAbrindo(false);
  }

  async function abrirChamado(e: React.FormEvent) {
    e.preventDefault();
    const desc = solicitacao.trim();
    if (desc.length < 5) {
      toast('Descreva a solicitação com um pouco mais de detalhe.', 'erro');
      return;
    }
    setEnviando(true);
    try {
      // Gera o token de consulta ao FAQ e abre o chamado na sequência.
      const { faqToken } = await api<{ faqToken: string }>('/faq/consultar', {
        method: 'POST',
        body: { termo: desc },
      });
      const titulo = desc.split('\n')[0].slice(0, 80);
      await api('/tickets', {
        method: 'POST',
        body: { titulo, descricao: desc, faqToken },
      });
      toast('Chamado aberto', 'sucesso');
      resetar();
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
          <Button onClick={() => (abrindo ? resetar() : setAbrindo(true))}>
            {abrindo ? 'Cancelar' : 'Novo chamado'}
          </Button>
        }
      />

      {abrindo && (
        <Card className="mb-6 p-5">
          <form onSubmit={abrirChamado} className="space-y-4">
            <Field
              label="Descreva sua solicitação"
              hint="Enquanto você digita, mostramos respostas do FAQ que podem já resolver."
            >
              <Textarea
                value={solicitacao}
                onChange={(e) => setSolicitacao(e.target.value)}
                required
                minLength={5}
                rows={3}
                placeholder="ex.: como anexo o CT-e"
              />
            </Field>

            {faqItens.length > 0 && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">
                  Isto pode já resolver:
                </p>
                {faqItens.map((f, i) => (
                  <details key={i} className="text-sm">
                    <summary className="cursor-pointer font-medium text-slate-800">
                      {f.pergunta}
                    </summary>
                    <p className="mt-1 text-slate-600">{f.resposta}</p>
                    <span className="mt-1 block text-xs text-slate-400">
                      {f.categoria}
                    </span>
                  </details>
                ))}
              </div>
            )}

            <Button type="submit" loading={enviando}>
              Não resolveu? Abrir chamado
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
