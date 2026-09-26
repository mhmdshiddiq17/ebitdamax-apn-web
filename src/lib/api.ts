const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Single-flight refresh: banyak request 401 paralel hanya memicu satu refresh. */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * Wrapper fetch ke Go API.
 * - credentials: "include" agar cookie access token terkirim otomatis
 * - Saat 401 (access token kedaluwarsa): refresh sekali lalu ulangi request
 * - Content-Type JSON otomatis
 * - Error distandarkan menjadi ApiError {status, message}
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await performFetch(path, options);

  // Endpoint auth dikelola langsung oleh pemanggil (login/refresh/logout).
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (refreshed) {
      res = await performFetch(path, options);
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      else if (body?.errors) message = JSON.stringify(body.errors);
    } catch {
      // body bukan JSON, biarkan statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function performFetch(path: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}
