const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333') + '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;

export function setTokens(access: string | null, refresh?: string | null) {
  accessToken = access;
  if (typeof window === 'undefined') return;
  if (access) localStorage.setItem('access', access);
  else localStorage.removeItem('access');
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem('refresh', refresh);
    else localStorage.removeItem('refresh');
  }
}

function getAccess(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') accessToken = localStorage.getItem('access');
  return accessToken;
}

async function tentarRefresh(): Promise<boolean> {
  const refresh =
    typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;
  if (!refresh) return false;
  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

interface Options extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: unknown;
  raw?: boolean;
}

export async function api<T = unknown>(
  path: string,
  opts: Options = {},
): Promise<T> {
  const { auth = true, body, raw, headers, ...rest } = opts;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  const build = (): RequestInit => ({
    ...rest,
    body: body == null ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    headers: {
      ...(body != null && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && getAccess() ? { Authorization: `Bearer ${getAccess()}` } : {}),
      ...(headers as Record<string, string>),
    },
  });

  let resp = await fetch(`${API_BASE}${path}`, build());
  if (resp.status === 401 && auth && (await tentarRefresh())) {
    resp = await fetch(`${API_BASE}${path}`, build());
  }

  if (!resp.ok) {
    let msg = `Erro ${resp.status}`;
    try {
      const e = await resp.json();
      msg = Array.isArray(e.message) ? e.message.join(', ') : (e.message ?? msg);
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(resp.status, msg);
  }

  if (raw) return resp as unknown as T;
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

export function getApiBase() {
  return API_BASE;
}

export function getStoredAccess() {
  return getAccess();
}
