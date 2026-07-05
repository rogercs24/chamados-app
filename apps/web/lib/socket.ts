'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getStoredAccess } from './api';

let socket: Socket | null = null;

function getSocket(): Socket {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
  if (!socket) {
    socket = io(url, {
      auth: { token: getStoredAccess() },
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

/** Assina eventos do Socket.IO e chama o handler (sempre a versão mais recente). */
export function useRealtime(eventos: string[], handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const s = getSocket();
    (s.auth as Record<string, unknown>) = { token: getStoredAccess() };
    if (!s.connected) s.connect();

    const cb = () => ref.current();
    eventos.forEach((e) => s.on(e, cb));
    return () => {
      eventos.forEach((e) => s.off(e, cb));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
