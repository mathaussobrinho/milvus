"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/client-api";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ClientRow = {
  id: string;
  name: string;
  publicCode: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initial: ClientRow[];
};

export function ClientesManager({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await apiFetch("/api/v1/clients");
      if (!res.ok) return;
      const data = (await res.json()) as ClientRow[];
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
      const res = await apiFetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
        }),
      });
      if (!res.ok) {
        const message = "Nao foi possivel criar o cliente.";
        setError(message);
        showToast({ title: "Erro ao criar cliente", description: message, variant: "error" });
        return;
      }
      setName("");
      setEmail("");
      setPhone("");
      await refresh();
      showToast({
        title: "Cliente criado",
        description: "Cadastro salvo com sucesso.",
        variant: "success",
      });
    } catch {
      setError("Falha de rede.");
      showToast({ title: "Erro ao criar cliente", description: "Falha de rede.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(row: ClientRow) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditEmail(row.email ?? "");
    setEditPhone(row.phone ?? "");
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/clients/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
        }),
      });
      if (!res.ok) {
        const message = "Nao foi possivel salvar.";
        setError(message);
        showToast({ title: "Erro ao salvar cliente", description: message, variant: "error" });
        return;
      }
      setEditingId(null);
      await refresh();
      showToast({
        title: "Cliente atualizado",
        description: "Alteracoes salvas com sucesso.",
        variant: "success",
      });
    } catch {
      setError("Falha de rede.");
      showToast({ title: "Erro ao salvar cliente", description: "Falha de rede.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este cliente?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/clients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Nao foi possivel excluir.");
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

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
      <p className="text-sm text-muted">
        Empresas que abrem chamados (ex.: rede hoteleira, unidades). Obrigatorio
        ao criar ticket como solicitante.
      </p>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-base font-semibold">Novo cliente</h3>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={onCreate}>
          <input
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              Incluir
            </button>
          </div>
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
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Atualizado</th>
              <th className="px-4 py-3 font-medium">Acoes</th>
              <th className="px-4 py-3 font-medium">Key</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-muted"
                  colSpan={6}
                >
                  Nenhum cliente cadastrado.
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
                      <Link
                        href={`/cadastros/clientes/${r.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {r.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <input
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    ) : (
                      r.email ?? "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <input
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    ) : (
                      r.phone ?? "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(r.updatedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
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
                          onClick={() => setEditingId(null)}
                          className="text-sm text-muted hover:underline"
                        >
                          Cancelar
                        </button>
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
                          disabled={busy}
                          onClick={() => remove(r.id)}
                          className="text-sm text-danger hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                      {r.publicCode || "—"}
                    </span>
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
