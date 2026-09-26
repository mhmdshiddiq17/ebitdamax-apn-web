/** Nama cookie access token (JWT) — harus sama dengan ACCESS_COOKIE di Go API. */
export const ACCESS_COOKIE = process.env.NEXT_PUBLIC_ACCESS_COOKIE ?? "ebitda_access";

/** Nama cookie refresh token — harus sama dengan REFRESH_COOKIE di Go API. */
export const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE ?? "ebitda_refresh";
