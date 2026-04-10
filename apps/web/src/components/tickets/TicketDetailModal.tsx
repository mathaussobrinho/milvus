"use client";

import { apiFetch } from "@/lib/client-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
export type TicketDetail = {
  id: string;
  title: string;
  clientProvidedDescription: string | null;
  description: string | null;
  status: string;
  priority: string;
  clientId: string | null;
  clientName: string | null;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
  comments: {
    id: string;
    body: string;
    isInternalOnly: boolean;
    authorName: string;
    isFromClient: boolean;
    authorAnalystId: string | null;
    createdAt: string;
  }[];
};

type ClientOption = { id: string; name: string };
type DeviceOption = { id: string; hostname: string; clientName: string };

type Props = {
  ticketId: string | null;
  onClose: () => void;
};

export function TicketDetailModal({ ticketId, onClose }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"detalhes" | "comentarios">("detalhes");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [editTitle, setEditTitle] = useState("");
  const [editInternal, setEditInternal] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editStatus, setEditStatus] = useState("open");
  const [editClientId, setEditClientId] = useState("");
  const [editDeviceId, setEditDeviceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setLoadError(null);
    try {
      const res = await apiFetch(`/api/v1/tickets/${ticketId}`);
      if (!res.ok) {
        setLoadError("Nao foi possivel carregar o ticket.");
        setDetail(null);
        return;
      }
      const data = (await res.json()) as TicketDetail;
      setDetail(data);
      setEditTitle(data.title);
      setEditInternal(data.description ?? "");
      setEditPriority(data.priority);
      setEditStatus(data.status);
      setEditClientId(data.clientId ?? "");
      setEditDeviceId(data.deviceId ?? "");
    } catch {
      setLoadError("Falha de rede.");
      setDetail(null);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) {
      setDetail(null);
      setCommentBody("");
      setInternalOnly(false);
      setTab("detalhes");
      return;
    }
    load();
  }, [ticketId, load]);

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    (async () => {
      try {
        const [cRes, dRes] = await Promise.all([
          apiFetch("/api/v1/clients"),
          apiFetch("/api/v1/devices"),
        ]);
        if (cancelled) return;
        if (cRes.ok) {
          const list = (await cRes.json()) as { id: string; name: string }[];
          setClients(list.map((c) => ({ id: c.id, name: c.name })));
        }
        if (dRes.ok) {
          const list = (await dRes.json()) as {
            id: string;
            hostname: string;
            clientName: string;
          }[];
          setDevices(
            list.map((d) => ({
              id: d.id,
              hostname: d.hostname,
              clientName: d.clientName,
            })),
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketId || !commentBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/v1/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentBody.trim(),
          isInternalOnly: internalOnly,
        }),
      });
      if (!res.ok) return;
      setCommentBody("");
      setInternalOnly(false);
      await load();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function saveTicketEdits(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketId) return;
    setSaveError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: editTitle.trim(),
        description: editInternal.trim() || null,
        updateDescription: true,
        priority: editPriority,
        status: editStatus,
        clientId: editClientId,
        deviceId: editDeviceId || null,
      };
      const res = await apiFetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setSaveError(j?.error ?? "Nao foi possivel salvar.");
        return;
      }
      await load();
      router.refresh();
    } catch {
      setSaveError("Falha de rede.");
    } finally {
      setSaving(false);
    }
  }

  if (!ticketId) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-detail-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-primary">
              #{ticketId.slice(0, 8).toUpperCase()}
            </p>
            <h2
              id="ticket-detail-title"
              className="mt-1 text-lg font-semibold text-foreground"
            >
              {detail?.title ?? "Carregando..."}
            </h2>
            {detail?.clientName ? (
              <p className="mt-1 text-sm text-muted">{detail.clientName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted hover:bg-background hover:text-foreground"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="flex shrink-0 gap-2 border-b border-border px-5 py-2">
          <button
            type="button"
            onClick={() => setTab("detalhes")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "detalhes"
                ? "bg-primary text-white"
                : "text-foreground/70 hover:bg-background"
            }`}
          >
            Detalhes
          </button>
          <button
            type="button"
            onClick={() => setTab("comentarios")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "comentarios"
                ? "bg-primary text-white"
                : "text-foreground/70 hover:bg-background"
            }`}
          >
            Comentarios
            {detail ? (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-xs text-foreground">
                {detail.comments.length}
              </span>
            ) : null}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loadError ? (
            <p className="text-sm text-danger">{loadError}</p>
          ) : !detail ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : tab === "detalhes" ? (
            <div className="space-y-5 text-sm text-foreground/90">
              <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                  Relato do solicitante (nao editavel)
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-foreground">
                  {detail.clientProvidedDescription?.trim() ||
                    "Nenhum relato registrado na abertura."}
                </p>
              </div>

              <form className="space-y-4" onSubmit={saveTicketEdits}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Edicao do chamado
                </h3>
                <div>
                  <label className="text-xs text-muted" htmlFor="ed-title">
                    Titulo
                  </label>
                  <input
                    id="ed-title"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" htmlFor="ed-int">
                    Observacoes internas (equipe)
                  </label>
                  <textarea
                    id="ed-int"
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={editInternal}
                    onChange={(e) => setEditInternal(e.target.value)}
                    placeholder="Notas da equipe; visivel conforme regras do ticket."
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted" htmlFor="ed-st">
                      Status
                    </label>
                    <select
                      id="ed-st"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="open">Aberto</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="waiting">Aguardando</option>
                      <option value="resolved">Resolvido</option>
                      <option value="closed">Fechado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted" htmlFor="ed-pr">
                      Prioridade
                    </label>
                    <select
                      id="ed-pr"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Critica</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted" htmlFor="ed-cl">
                    Empresa / cliente vinculado
                  </label>
                  <select
                    id="ed-cl"
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted" htmlFor="ed-dev">
                    Dispositivo
                  </label>
                  <select
                    id="ed-dev"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={editDeviceId}
                    onChange={(e) => setEditDeviceId(e.target.value)}
                  >
                    <option value="">Nenhum</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.clientName} — {d.hostname}
                      </option>
                    ))}
                  </select>
                </div>
                {saveError ? (
                  <p className="text-sm text-danger">{saveError}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </form>

              <dl className="grid gap-2 border-t border-border pt-4 text-xs text-muted sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Criado</dt>
                  <dd>{new Date(detail.createdAt).toLocaleString("pt-BR")}</dd>
                </div>
                <div>
                  <dt className="text-muted">Atualizado</dt>
                  <dd>{new Date(detail.updatedAt).toLocaleString("pt-BR")}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="space-y-4">
                {detail.comments.length === 0 ? (
                  <li className="text-sm text-muted">Nenhum comentario ainda.</li>
                ) : (
                  detail.comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-border bg-background/70 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {c.authorName}
                          </span>
                          {c.isFromClient ? (
                            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-sky-800">
                              Cliente
                            </span>
                          ) : (
                            <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                              Analista
                            </span>
                          )}
                          <span>
                            {new Date(c.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <span
                          className={
                            c.isInternalOnly
                              ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-900"
                              : "rounded bg-sky-100 px-1.5 py-0.5 text-sky-800"
                          }
                        >
                          {c.isInternalOnly
                            ? "Somente analistas"
                            : "Cliente e analistas"}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                        {c.body}
                      </p>
                    </li>
                  ))
                )}
              </ul>

              <form className="space-y-3 border-t border-border pt-4" onSubmit={submitComment}>
                <h3 className="text-sm font-medium text-foreground">Novo comentario</h3>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                  placeholder="Escreva o comentario..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <fieldset className="space-y-2 text-sm text-foreground/80">
                  <legend className="text-xs text-muted">Quem pode ver?</legend>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="vis"
                      checked={!internalOnly}
                      onChange={() => setInternalOnly(false)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium text-foreground">Cliente e analistas</span>
                      <span className="block text-xs text-muted">
                        Visivel para a empresa (cliente) e para a equipe interna.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="vis"
                      checked={internalOnly}
                      onChange={() => setInternalOnly(true)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium text-foreground">Somente analistas</span>
                      <span className="block text-xs text-muted">
                        Nota interna; o cliente nao ve este comentario.
                      </span>
                    </span>
                  </label>
                </fieldset>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Publicar comentario"}
                </button>
              </form>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/80 hover:bg-background"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
