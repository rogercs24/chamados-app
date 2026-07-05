'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    if (path == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<T>(path)
      .then((d) => {
        setData(d);
        setErro(null);
      })
      .catch((e) => setErro((e as Error).message))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { data, loading, erro, recarregar };
}
