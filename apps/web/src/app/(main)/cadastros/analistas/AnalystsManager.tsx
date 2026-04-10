"use client";

import { apiFetch } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AnalystRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isMaster: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initial: AnalystRow[];
};

export function AnalystsManager({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [mustChangeOnNextLogin, setMustChangeOnNextLogin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await apiFetch("/api/v1/analysts");
      if (!res.ok) return;
      const data = (await res.json()) as AnalystRow[];
      setRows(data);
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch("/api/v1/analysts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone.trim() || null,
          mustChangePasswordOnNextLogin: mustChangeOnNextLogin,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? "Nao foi possivel criar o analista.");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setMustChangeOnNextLogin(false);
      await refresh();
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(row: AnalystRow) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditEmail(row.email);
    setEditPhone(row.phone ?? "");
    setEditPassword("");
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string | boolean | null> = {
        name: editName,
        email: editEmail,
        phone: editPhone.trim() || null,
      };
      if (editPassword.trim()) body.password = editPassword;
      const res = await apiFetch(`/api/v1/analysts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? "Nao foi possivel salvar.");
        return;
      }
      setEditingId(null);
      setEditPassword("");
      await refresh();
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este analista?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/analysts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? "Nao foi possivel excluir.");
        return;
      }
      if (editingId === id) setEditingId(null);
      await refresh();
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }

  function formatLogin(iso: string | null) {
    if (!iso) return "Nunca";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold text-foreground">Analistas</h2>
      <p className="text-sm text-muted">
        Usuarios internos que atendem chamados. Senhas com hash (BCrypt). O
        ultimo login e atualizado a cada entrada na plataforma.
      </p>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-base font-semibold">Novo analista</h3>
        <form className="mt-4 space-y-4" onSubmit={onCreate}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              required
              type="email"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="tel"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Telefone (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              required
              type="password"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 sm:w-auto"
              >
                Incluir
              </button>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-border"
              checked={mustChangeOnNextLogin}
              onChange={(e) => setMustChangeOnNextLogin(e.target.checked)}
            />
            <span>
              Obrigar a alterar a senha no proximo login
              <span className="mt-0.5 block text-xs text-muted">
                Apos o primeiro acesso, o usuario precisara definir uma nova senha.
              </span>
            </span>
          </label>
        </form>
      </section>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Atualizado</th>
              <th className="px-4 py-3 font-medium">Ultimo login</th>
              <th className="px-4 py-3 font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={5}>
                  Nenhum analista cadastrado.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-background/80">
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <input
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.name}</span>
                        {r.isMaster ? (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Master
                          </span>
                        ) : null}
                        {r.mustChangePassword ? (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                            Trocar senha
                          </span>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <input
                        type="email"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    ) : (
                      r.email
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(r.updatedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                      {formatLogin(r.lastLoginAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="tel"
                          className="w-full max-w-xs rounded border border-border bg-background px-2 py-1 text-sm"
                          placeholder="Telefone (opcional)"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                        <input
                          type="password"
                          className="w-full max-w-xs rounded border border-border bg-background px-2 py-1 text-sm"
                          placeholder="Nova senha (opcional)"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={saveEdit}
                            className="text-sm text-primary hover:underline"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(null);
                              setEditPassword("");
                            }}
                            className="text-sm text-muted hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(r)}
                          className="text-sm text-primary hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={busy || r.isMaster}
                          onClick={() => remove(r.id)}
                          className="text-sm text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                          title={r.isMaster ? "Usuario master nao pode ser excluido" : undefined}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
