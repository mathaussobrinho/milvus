export const AUTH_COOKIE = "visohelp_token";
export const AUTH_STORAGE_KEY = "visohelp_token";

export function persistAuthToken(token: string, maxAgeSeconds: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  const maxAge = Math.max(60, maxAgeSeconds);
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}
