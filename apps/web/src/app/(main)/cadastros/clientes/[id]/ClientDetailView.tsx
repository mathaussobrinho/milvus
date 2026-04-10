"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { priorityLabel, statusLabel } from "@/components/tickets/ticketLabels";
import { apiFetch } from "@/lib/client-api";
import { showToast } from "@/lib/toast";

export type ClientDetail = {
  id: string;
  name: string;
  publicCode: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  tickets: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    clientId: string | null;
    clientName: string | null;
    deviceId: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  employees?: {
    id: string;
    name: string;
    department: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
    createdAt?: string;
    updatedAt?: string;
  }[];
};

type Props = {
  initial: ClientDetail;
};

export function ClientDetailView({ initial }: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initial.employees ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPrimary, setNewPrimary] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPrimary, setEditPrimary] = useState(false);

  async function reloadEmployees() {
    const res = await apiFetch(`/api/v1/clients/${initial.id}`);
    if (!res.ok) throw new Error("load_failed");
    const data = (await res.json()) as ClientDetail;
    setEmployees(data.employees ?? []);
    router.refresh();
  }

  async function onCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch(`/api/v1/clients/${initial.id}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          department: newDepartment || null,
          role: newRole || null,
          email: newEmail || null,
          phone: newPhone || null,
          isPrimary: newPrimary,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = j?.error ?? "Nao foi possivel incluir funcionario.";
        setError(message);
        showToast({ title: "Erro ao incluir funcionario", description: message, variant: "error" });
        return;
      }
      setNewName("");
      setNewDepartment("");
      setNewRole("");
      setNewEmail("");
      setNewPhone("");
      setNewPrimary(false);
      await reloadEmployees();
      showToast({
        title: "Funcionario incluido",
        description: "Cadastro salvo com sucesso.",
        variant: "success",
      });
    } catch {
      setError("Falha de rede.");
      showToast({ title: "Erro ao incluir funcionario", description: "Falha de rede.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  function startEditEmployee(emp: NonNullable<ClientDetail["employees"]>[number]) {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditDepartment(emp.department ?? "");
    setEditRole(emp.role ?? "");
    setEditEmail(emp.email ?? "");
    setEditPhone(emp.phone ?? "");
    setEditPrimary(emp.isPrimary);
    setError(null);
  }

  async function saveEmployee() {
    if (!editingId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch(`/api/v1/clients/${initial.id}/employees/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          department: editDepartment || null,
          role: editRole || null,
          email: editEmail || null,
          phone: editPhone || null,
          isPrimary: editPrimary,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = j?.error ?? "Nao foi possivel salvar funcionario.";
        setError(message);
        showToast({ title: "Erro ao salvar funcionario", description: message, variant: "error" });
        return;
      }
      setEditingId(null);
      await reloadEmployees();
      showToast({
        title: "Funcionario atualizado",
        description: "Alteracoes salvas com sucesso.",
        variant: "success",
      });
    } catch {
      setError("Falha de rede.");
      showToast({ title: "Erro ao salvar funcionario", description: "Falha de rede.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function removeEmployee(id: string) {
    if (!confirm("Excluir este funcionario?")) return;
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch(`/api/v1/clients/${initial.id}/employees/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = j?.error ?? "Nao foi possivel excluir funcionario.";
        setError(message);
        showToast({ title: "Erro ao excluir funcionario", description: message, variant: "error" });
        return;
      }
      if (editingId === id) setEditingId(null);
      await reloadEmployees();
      showToast({
        title: "Funcionario excluido",
        description: "Registro removido com sucesso.",
        variant: "success",
      });
    } catch {
      setError("Falha de rede.");
      showToast({ title: "Erro ao excluir funcionario", description: "Falha de rede.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {initial.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Visao consolidada: dados do cliente e tickets vinculados.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Key publica
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-primary">
            {initial.publicCode}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            E-mail
          </p>
          <p className="mt-1 text-sm text-foreground">{initial.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Telefone
          </p>
          <p className="mt-1 text-sm text-foreground">{initial.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Cadastro
          </p>
          <p className="mt-1 text-sm text-foreground">
            {new Date(initial.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Tickets desta empresa
        </h2>
        <p className="mt-1 text-sm text-muted">
          Chamados vinculados a este cliente. Abra na central de tickets para ver
          detalhes e comentarios.
        </p>

        {initial.tickets.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum ticket ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Atualizado</th>
                  <th className="px-4 py-3 font-medium">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initial.tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-background/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.title}</p>
                      {t.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {t.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {priorityLabel[t.priority] ?? t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {statusLabel[t.status] ?? t.status}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(t.updatedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets?ticket=${t.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Funcionarios desta empresa
        </h2>
        <p className="mt-1 text-sm text-muted">
          Contatos internos do cliente para atendimento. Alem de nome e
          departamento, incluimos <strong>cargo</strong> para facilitar a
          priorizacao e o encaminhamento.
        </p>

        <form
          className="mt-4 grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
          onSubmit={onCreateEmployee}
        >
          <input
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Nome"
          />
          <input
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Departamento"
          />
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Cargo"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="E-mail"
          />
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Telefone"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={newPrimary}
                onChange={(e) => setNewPrimary(e.target.checked)}
              />
              Contato principal
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              Incluir
            </button>
          </div>
        </form>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        {employees.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nenhum funcionario cadastrado para este cliente.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Departamento</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-background/80">
                    <td className="px-4 py-3">
                      {editingId === emp.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {emp.name}
                          </span>
                          {emp.isPrimary ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Principal
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {editingId === emp.id ? (
                        <input
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        />
                      ) : (
                        emp.department ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {editingId === emp.id ? (
                        <input
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        />
                      ) : (
                        emp.role ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {editingId === emp.id ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="rounded border border-border bg-background px-2 py-1 text-sm"
                            placeholder="E-mail"
                          />
                          <input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="rounded border border-border bg-background px-2 py-1 text-sm"
                            placeholder="Telefone"
                          />
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={editPrimary}
                              onChange={(e) => setEditPrimary(e.target.checked)}
                            />
                            Principal
                          </label>
                        </div>
                      ) : (
                        emp.email ?? emp.phone ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === emp.id ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEmployee}
                            disabled={busy}
                            className="text-sm text-primary hover:underline"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={busy}
                            className="text-sm text-muted hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditEmployee(emp)}
                            disabled={busy}
                            className="text-sm text-primary hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEmployee(emp.id)}
                            disabled={busy}
                            className="text-sm text-danger hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
