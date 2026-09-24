import { cookies } from "next/headers";
import { ApiError } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Dilempar saat API mengembalikan 401 (sesi tidak ada/berakhir). */
export class UnauthorizedError extends Error {
  constructor() {
    super("Belum masuk");
    this.name = "UnauthorizedError";
  }
}

/**
 * Fetch ke Go API dari Server Component: meneruskan cookie browser
 * (session) sehingga request dianggap terautentikasi.
 */
export async function serverApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // body bukan JSON
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
