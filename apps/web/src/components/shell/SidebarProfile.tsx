"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { clearAuthToken } from "@/lib/auth-token";

type Profile = {
  name: string;
  email: string;
  avatarDataUrl: string | null;
};

export function SidebarProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/account/profile");
      if (!res.ok) return;
      const data = (await res.json()) as Profile;
      setProfile(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onRefresh() {
      load();
    }
    window.addEventListener("visohelp-profile-changed", onRefresh);
    return () => window.removeEventListener("visohelp-profile-changed", onRefresh);
  }, [load]);

  function logout() {
    clearAuthToken();
    router.push("/login");
    router.refresh();
  }

  const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="rounded-xl border border-border bg-gradient-to-b from-surface to-background/80 p-3 shadow-sm">
      <Link
        href="/configuracoes/perfil"
        className="flex flex-col items-center gap-2 rounded-lg px-1 py-2 text-center transition hover:bg-primary/5"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/50 bg-background shadow-[0_0_0_1px_rgba(0,72,255,0.2)]">
          {profile?.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarDataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-primary">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 px-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {profile?.name ?? "..."}
          </p>
          <p className="truncate text-[10px] text-muted">{profile?.email}</p>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
          Editar perfil
        </span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-danger/45 bg-danger/10 py-2.5 text-sm font-semibold text-danger shadow-sm transition hover:bg-danger/18 hover:border-danger/60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
          aria-hidden
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
        Sair da conta
      </button>
    </div>
  );
}
