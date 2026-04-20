export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Copy apps/web/.env.example to apps/web/.env.local and set the value.',
    );
  }
  return raw.trim().replace(/\/$/, '');
}

function buildUrl(path: string): string {
  const base = getBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Append URL search params; omits undefined, null, and empty string values. */
export function withQuery(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  if (!qs) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${qs}`;
}

async function parseResponseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
  return text as unknown as T;
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
  }
  return fallback;
}

async function requestCore<T>(
  path: string,
  init: RequestInit,
): Promise<{ data: T; status: number }> {
  const url = buildUrl(path);
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...init, headers });
  const data = await parseResponseBody<unknown>(res);

  if (!res.ok) {
    const fallback = res.statusText || 'Request failed';
    throw new ApiError(errorMessageFromBody(data, fallback), res.status, data);
  }

  return { data: data as T, status: res.status };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { data } = await requestCore<T>(path, init);
  return data;
}

export function get<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: 'GET' });
}

export function post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function remove<T = void>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: 'DELETE' });
}

export function postWithStatus<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  return requestCore<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
