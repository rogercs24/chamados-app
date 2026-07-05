'use client';

import { api } from './api';

/** Baixa um arquivo protegido (envia o token de auth e força o download). */
export async function baixarArquivo(path: string, nome: string): Promise<void> {
  const resp = await api<Response>(path, { raw: true });
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
