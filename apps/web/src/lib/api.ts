import { cookies } from "next/headers";
import { AUTH_COOKIE } from "./auth-token";
import { getApiBase } from "./api-base";

export { getApiBase };

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const headers = new Headers(init?.headers);
  try {
    const jar = await cookies();
    const raw = jar.get(AUTH_COOKIE)?.value;
    if (raw) {
      const t = decodeURIComponent(raw);
      headers.set("Authorization", `Bearer ${t}`);
    }
  } catch {
    /* fora de request RSC */
  }
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      cache: "no-store",
      ...init,
      headers,
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
