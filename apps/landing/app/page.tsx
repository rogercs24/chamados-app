export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-indigo-950 text-white">
      <section className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-6 py-32 text-center">
        <span className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-indigo-200">
          Multi-tenant • Seguro • Tempo real
        </span>
        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Gestão de chamados que{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
            escala com a sua operação
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Triagem inteligente, atendimento por área e indicadores em tempo real —
          tudo com isolamento total entre empresas. A landing page completa, com
          storytelling e animações, chega na Fase 5.
        </p>
        <div className="flex gap-4">
          <a
            href="http://localhost:3000"
            className="rounded-lg bg-indigo-500 px-6 py-3 font-medium transition hover:bg-indigo-400"
          >
            Acessar plataforma
          </a>
          <a
            href="#saiba-mais"
            className="rounded-lg border border-white/20 px-6 py-3 font-medium transition hover:bg-white/10"
          >
            Saiba mais
          </a>
        </div>
      </section>
    </main>
  );
}
