export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
        Fase 0 — Fundação
      </span>
      <h1 className="text-4xl font-bold tracking-tight">
        Plataforma de Chamados
      </h1>
      <p className="max-w-prose text-slate-600">
        Área administrativa multi-tenant. Autenticação, RBAC e os módulos de
        domínio chegam nas próximas fases.
      </p>
    </main>
  );
}
