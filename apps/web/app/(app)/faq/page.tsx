'use client';

import { useMemo, useState } from 'react';
import { useApi } from '../../../lib/use-api';
import { Card, EmptyState, Input, PageHeader, Spinner } from '../../../components/ui';

interface FaqItem {
  categoria: string;
  pergunta: string;
  resposta: string;
}

export default function FaqPage() {
  const { data, loading } = useApi<FaqItem[]>('/faq');
  const [busca, setBusca] = useState('');

  const porCategoria = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const itens = (data ?? []).filter((f) =>
      termo
        ? (f.pergunta + ' ' + f.resposta + ' ' + f.categoria)
            .toLowerCase()
            .includes(termo)
        : true,
    );
    const grupos = new Map<string, FaqItem[]>();
    for (const item of itens) {
      const lista = grupos.get(item.categoria) ?? [];
      lista.push(item);
      grupos.set(item.categoria, lista);
    }
    return Array.from(grupos.entries());
  }, [data, busca]);

  return (
    <div>
      <PageHeader
        title="Base de conhecimento"
        subtitle="Perguntas frequentes — consulte antes de abrir um chamado"
      />

      <div className="mb-6 max-w-md">
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no FAQ…"
        />
      </div>

      {loading ? (
        <div className="grid h-40 place-items-center">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : porCategoria.length === 0 ? (
        <EmptyState>Nenhuma pergunta encontrada para essa busca.</EmptyState>
      ) : (
        <div className="space-y-6">
          {porCategoria.map(([categoria, itens]) => (
            <div key={categoria}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#5a8a2c]">
                {categoria}
              </h2>
              <Card className="divide-y divide-slate-100">
                {itens.map((f, i) => (
                  <details key={i} className="group p-4">
                    <summary className="cursor-pointer list-none font-medium text-slate-800 marker:content-none">
                      <span className="mr-2 text-[#7cb342] group-open:hidden">+</span>
                      <span className="mr-2 hidden text-[#7cb342] group-open:inline">−</span>
                      {f.pergunta}
                    </summary>
                    <p className="mt-2 pl-5 text-sm text-slate-600">{f.resposta}</p>
                  </details>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
