'use client';

import { useEffect, useState } from 'react';
import { setTokens } from '../../../lib/api';

/**
 * Destino do redirect pós-login OAuth (Google/GitHub). A API manda os tokens no
 * fragmento (#access=...&refresh=...); aqui eles são guardados e seguimos para o
 * dashboard. Recarga completa (window.location) para o AuthProvider recarregar o
 * usuário (/auth/me) já com o token.
 */
export default function OAuthCallbackPage() {
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access = params.get('access');
    const refresh = params.get('refresh');
    if (access) {
      setTokens(access, refresh);
      window.location.replace('/dashboard');
    } else {
      setErro(true);
    }
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 to-indigo-100 p-4 text-center">
      {erro ? (
        <div>
          <p className="text-sm text-red-600">Não foi possível concluir o login.</p>
          <a href="/login" className="text-sm font-medium text-indigo-600 hover:underline">
            Voltar ao login
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Entrando…</p>
      )}
    </div>
  );
}
