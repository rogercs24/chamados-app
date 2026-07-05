'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { Spinner, cn } from '../../components/ui';
import { PAPEL_LABEL } from '../../lib/format';
import type { Papel } from '../../lib/types';

const NAV: { href: string; label: string; papeis: Papel[] | '*' }[] = [
  { href: '/dashboard', label: 'Dashboard', papeis: ['SUPER_ADMIN', 'ADMIN', 'TRIAGEM'] },
  { href: '/chamados', label: 'Chamados', papeis: '*' },
  { href: '/usuarios', label: 'Usuários', papeis: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/clientes', label: 'Clientes', papeis: ['SUPER_ADMIN', 'ADMIN', 'TRADE'] },
  { href: '/importacoes', label: 'Importações', papeis: ['SUPER_ADMIN', 'ADMIN', 'TRADE'] },
  { href: '/relatorios', label: 'Relatórios', papeis: ['SUPER_ADMIN', 'ADMIN', 'TRIAGEM'] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const itens = NAV.filter(
    (n) => n.papeis === '*' || n.papeis.includes(user.papel),
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            C
          </div>
          <span className="font-semibold text-slate-900">Chamados</span>
        </div>
        <nav className="flex-1 space-y-1">
          {itens.map((n) => {
            const ativo = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition',
                  ativo
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="md:hidden font-semibold">Chamados</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">
                {user.nome}
              </div>
              <div className="text-xs text-slate-500">
                {PAPEL_LABEL[user.papel]}
              </div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => logout().then(() => router.replace('/login'))}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
