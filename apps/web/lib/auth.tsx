'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, setTokens } from './api';
import type { Usuario } from './types';

interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string, mfaCode?: string) => Promise<void>;
  register: (
    empresaNome: string,
    nome: string,
    email: string,
    senha: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve estar dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<Usuario>('/auth/me');
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, senha: string, mfaCode?: string) {
    const d = await api<{ accessToken: string; refreshToken: string; usuario: Usuario }>(
      '/auth/login',
      { method: 'POST', auth: false, body: { email, senha, mfaCode } },
    );
    setTokens(d.accessToken, d.refreshToken);
    setUser(d.usuario);
  }

  async function register(
    empresaNome: string,
    nome: string,
    email: string,
    senha: string,
  ) {
    const d = await api<{ accessToken: string; refreshToken: string; usuario: Usuario }>(
      '/auth/register',
      { method: 'POST', auth: false, body: { empresaNome, nome, email, senha } },
    );
    setTokens(d.accessToken, d.refreshToken);
    setUser(d.usuario);
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignora */
    }
    setTokens(null, null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
