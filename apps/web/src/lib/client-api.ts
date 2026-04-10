import { getApiBase } from "./api-base";
import { AUTH_STORAGE_KEY } from "./auth-token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const t = getStoredToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  return fetch(`${getApiBase()}${path}`, { ...init, headers });
}
