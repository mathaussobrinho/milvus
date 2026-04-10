"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { AVATAR_MAX_BYTES, compressImageFileToDataUrl } from "@/lib/compress-image";
import { showToast } from "@/lib/toast";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarDataUrl: string | null;
  isMaster: boolean;
  mustChangePassword: boolean;
  groups: string[];
};

export function PerfilForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState<string | null>(null);
  const [avatarCompressing, setAvatarCompressing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/v1/account/profile");
        if (!res.ok) {
          if (!cancelled) setLoadError("Nao foi possivel carregar o perfil. Faca login novamente.");
          return;
        }
        const data = (await res.json()) as Profile;
        if (cancelled) return;
        setProfile(data);
        setName(data.name);
        setPhone(data.phone ?? "");
        setAvatarPreview(data.avatarDataUrl);
        setAvatarPending(null);
        setLoadError(null);
      } catch {
        if (!cancelled) setLoadError("Falha de rede.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setBusy(true);
    try {
      const res = await apiFetch("/api/v1/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          ...(avatarPending !== null
            ? {
                avatarDataUrl:
                  avatarPending === "__clear__" ? "" : avatarPending,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = j?.error ?? "Nao foi possivel salvar.";
        setSaveError(message);
        showToast({
          title: "Erro ao salvar perfil",
          description: message,
          variant: "error",
        });
        return;
      }
      const refreshed = await apiFetch("/api/v1/account/profile");
      if (refreshed.ok) {
        const data = (await refreshed.json()) as Profile;
        setProfile(data);
        setAvatarPreview(data.avatarDataUrl);
        setAvatarPending(null);
      }
      window.dispatchEvent(new Event("visohelp-profile-changed"));
      showToast({
        title: "Perfil salvo",
        description: "As alteracoes foram gravadas com sucesso.",
        variant: "success",
      });
    } catch {
      setSaveError("Falha de rede.");
      showToast({
        title: "Erro ao salvar perfil",
        description: "Falha de rede.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-400">{loadError}</p>;
  }

  if (!profile) {
    return <p className="text-sm text-muted">Carregando perfil...</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Dados pessoais</h2>
        <p className="mt-1 text-sm text-muted">
          O e-mail e o login nao podem ser alterados aqui; fale com um administrador se precisar
          mudar o e-mail.
        </p>

        <form className="mt-5 space-y-4" onSubmit={onSave}>
          <div>
            <span className="text-xs font-medium text-muted">Foto do perfil</span>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-background">
                {avatarPending && avatarPending !== "__clear__" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPending}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-primary">
                    {name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <label
                  className={`cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-center font-medium hover:bg-background/80 ${avatarCompressing ? "pointer-events-none opacity-60" : ""}`}
                >
                  {avatarCompressing ? "Otimizando..." : "Carregar imagem"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={avatarCompressing}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      setSaveError(null);
                      setAvatarCompressing(true);
                      void (async () => {
                        try {
                          const dataUrl = await compressImageFileToDataUrl(f, AVATAR_MAX_BYTES);
                          setAvatarPending(dataUrl);
                        } catch (err) {
                          setSaveError(
                            err instanceof Error ? err.message : "Falha ao processar a imagem."
                          );
                        } finally {
                          setAvatarCompressing(false);
                        }
                      })();
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-danger hover:underline"
                  onClick={() => {
                    setAvatarPending("__clear__");
                    setAvatarPreview(null);
                  }}
                >
                  Remover foto
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted">
              JPEG, PNG, WebP ou GIF. A foto e ajustada automaticamente para no maximo ~450 KB (JPEG).
              Aparece na barra lateral; salve com &quot;Salvar alteracoes&quot;.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted" htmlFor="nome">
              Nome
            </label>
            <input
              id="nome"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <span className="text-xs font-medium text-muted">E-mail</span>
            <p className="mt-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground">
              {profile.email}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted" htmlFor="tel">
              Telefone
            </label>
            <input
              id="tel"
              type="tel"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          {saveError ? (
            <p className="text-sm text-red-400" role="alert">
              {saveError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || avatarCompressing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Grupos</h2>
        <p className="mt-1 text-sm text-muted">
          Equipes e grupos aos quais sua conta esta vinculada (definidos pelos cadastros de
          analistas).
        </p>
        {profile.groups.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum grupo vinculado ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.groups.map((g) => (
              <li
                key={g}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {g}
              </li>
            ))}
          </ul>
        )}
        {profile.isMaster ? (
          <p className="mt-4 text-xs text-amber-700 dark:text-amber-400">
            Conta master: privilegios administrativos completos na plataforma.
          </p>
        ) : null}
        {profile.mustChangePassword ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Voce precisara alterar a senha no proximo acesso (definido pelo administrador).
          </p>
        ) : null}
      </section>
    </div>
  );
}
