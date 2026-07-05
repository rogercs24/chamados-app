'use client';

import { useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { baixarArquivo } from '../../../lib/download';
import { useToast } from '../../../components/toast';
import { Button, Card, PageHeader, Spinner } from '../../../components/ui';

interface ReportJob {
  id: string;
  status: string;
  arquivoNome?: string | null;
}

export default function RelatoriosPage() {
  const toast = useToast();
  const [job, setJob] = useState<ReportJob | null>(null);
  const [gerando, setGerando] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function poll(id: string) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      try {
        const st = await api<ReportJob>(`/reports/${id}`);
        setJob(st);
        if (st.status === 'CONCLUIDO' || st.status === 'FALHOU') {
          if (timer.current) clearInterval(timer.current);
        }
      } catch {
        if (timer.current) clearInterval(timer.current);
      }
    }, 500);
  }

  async function gerar() {
    setGerando(true);
    try {
      const r = await api<{ jobId: string }>('/reports/tickets', {
        method: 'POST',
      });
      setJob({ id: r.jobId, status: 'PENDENTE' });
      poll(r.jobId);
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Relatórios"
        subtitle="Geração assíncrona do relatório de chamados (XLSX)"
      />

      <Card className="p-5">
        <Button onClick={gerar} loading={gerando}>
          Gerar relatório de chamados
        </Button>

        {job && (
          <div className="mt-5 flex items-center gap-3">
            {job.status !== 'CONCLUIDO' && job.status !== 'FALHOU' && (
              <Spinner className="h-5 w-5 text-slate-400" />
            )}
            <span className="text-sm text-slate-600">Status: {job.status}</span>
            {job.status === 'CONCLUIDO' && (
              <Button
                variant="secondary"
                onClick={() =>
                  baixarArquivo(
                    `/reports/${job.id}/download`,
                    job.arquivoNome ?? 'relatorio.xlsx',
                  )
                }
              >
                Baixar XLSX
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
