'use client';

import { useApi } from '../../../lib/use-api';
import { Card, PageHeader, Spinner } from '../../../components/ui';
import { STATUS_LABEL, duracao } from '../../../lib/format';
import type { StatusChamado } from '../../../lib/types';

interface Overview {
  total: number;
  porStatus: Record<StatusChamado, number>;
  tempoMedioRespostaSegundos: number | null;
  tempoMedioResolucaoSegundos: number | null;
}
interface Serie {
  granularidade: string;
  pontos: { periodo: string; total: number }[];
}

function Kpi({ label, valor }: { label: string; valor: string | number }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{valor}</div>
    </Card>
  );
}

export default function DashboardPage() {
  const ov = useApi<Overview>('/dashboard/overview');
  const area = useApi<{ area: string; total: number }[]>('/dashboard/por-area');
  const serie = useApi<Serie>('/dashboard/serie?granularidade=month');

  if (ov.loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

  const o = ov.data;
  const maxSerie = Math.max(1, ...(serie.data?.pontos.map((p) => p.total) ?? []));
  const maxArea = Math.max(1, ...(area.data?.map((a) => a.total) ?? []));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Indicadores de chamados" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total de chamados" valor={o?.total ?? 0} />
        <Kpi label="Em triagem" valor={o?.porStatus.TRIAGEM ?? 0} />
        <Kpi label="Em andamento" valor={o?.porStatus.EM_ANDAMENTO ?? 0} />
        <Kpi
          label="Tempo médio de resposta"
          valor={duracao(o?.tempoMedioRespostaSegundos)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Chamados por mês
          </h3>
          {serie.data && serie.data.pontos.length > 0 ? (
            <div className="flex h-48 items-end gap-2">
              {serie.data.pontos.map((p) => (
                <div key={p.periodo} className="flex flex-1 flex-col items-center gap-1">
                  <div className="text-xs font-medium text-slate-600">{p.total}</div>
                  <div
                    className="w-full rounded-t bg-indigo-500"
                    style={{ height: `${(p.total / maxSerie) * 100}%`, minHeight: 4 }}
                  />
                  <div className="text-[10px] text-slate-400">{p.periodo}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Sem dados no período.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Chamados por área
          </h3>
          {area.data && area.data.length > 0 ? (
            <div className="space-y-3">
              {area.data.map((a) => (
                <div key={a.area}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600">
                    <span>{a.area}</span>
                    <span className="font-medium">{a.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${(a.total / maxArea) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhum chamado triado ainda.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {(Object.keys(STATUS_LABEL) as StatusChamado[]).map((s) => (
          <Card key={s} className="p-4 text-center">
            <div className="text-xs text-slate-500">{STATUS_LABEL[s]}</div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {o?.porStatus[s] ?? 0}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
