'use client';

import { useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { useToast } from '../../../components/toast';
import { Button, Card, PageHeader } from '../../../components/ui';

interface Job {
  id: string;
  status: string;
  total: number;
  processados: number;
  sucesso: number;
  falhas: number;
  erros?: { linha: number; erro: string }[] | null;
}

export default function ImportacoesPage() {
  const toast = useToast();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function poll(id: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const st = await api<Job>(`/imports/${id}`);
        setJob(st);
        if (st.status === 'CONCLUIDO' || st.status === 'FALHOU') {
          if (timer.current) clearInterval(timer.current);
        }
      } catch {
        if (timer.current) clearInterval(timer.current);
      }
    }, 500);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('file', arquivo);
      const r = await api<{ jobId: string; total: number }>('/imports/clients', {
        method: 'POST',
        body: fd,
      });
      toast('Importação iniciada', 'sucesso');
      setJob({
        id: r.jobId,
        status: 'PENDENTE',
        total: r.total,
        processados: 0,
        sucesso: 0,
        falhas: 0,
      });
      poll(r.jobId);
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setEnviando(false);
    }
  }

  const pct = job && job.total ? Math.round((job.processados / job.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Importações"
        subtitle="Importe clientes de uma planilha CSV ou XLSX"
      />

      <Card className="p-5">
        <form onSubmit={enviar} className="space-y-4">
          <p className="text-sm text-slate-500">
            Colunas reconhecidas: <code>cnpj</code>, <code>razaoSocial</code>,{' '}
            <code>nomeFantasia</code>, <code>email</code>, <code>telefone</code>,{' '}
            <code>cep</code>, <code>cidade</code>, <code>uf</code>.
          </p>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="block text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 hover:file:bg-slate-200"
          />
          <Button type="submit" loading={enviando} disabled={!arquivo}>
            Importar
          </Button>
        </form>
      </Card>

      {job && (
        <Card className="mt-6 p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-700">
              Status: {job.status}
            </span>
            <span className="text-slate-500">
              {job.processados}/{job.total}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-emerald-600">✓ {job.sucesso} sucesso</span>
            <span className="text-red-600">✕ {job.falhas} falhas</span>
          </div>
          {job.erros && job.erros.length > 0 && (
            <div className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {job.erros.map((e, i) => (
                <div key={i}>
                  Linha {e.linha}: {e.erro}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
