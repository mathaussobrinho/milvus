"use client";

import { apiFetch } from "@/lib/client-api";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DeviceOption = {
  id: string;
  hostname: string;
  clientName: string;
};

type ClientOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewTicketModal({ open, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deviceId, setDeviceId] = useState("");
  const [requesterClientId, setRequesterClientId] = useState("");
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          apiFetch("/api/v1/devices"),
          apiFetch("/api/v1/clients"),
        ]);
        if (cancelled) return;
        if (dRes.ok) {
          const data = (await dRes.json()) as {
            id: string;
            hostname: string;
            clientName: string;
          }[];
          setDevices(
            data.map((x) => ({
              id: x.id,
              hostname: x.hostname,
              clientName: x.clientName,
            })),
          );
        }
        if (cRes.ok) {
          const data = (await cRes.json()) as {
            id: string;
            name: string;
          }[];
          setClients(data.map((x) => ({ id: x.id, name: x.name })));
        }
      } catch {
        /* lista vazia */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setClientMessage("");
      setInternalNotes("");
      setPriority("medium");
      setDeviceId("");
      setRequesterClientId("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!requesterClientId) {
      setError("Selecione o solicitante (empresa cliente).");
      setLoading(false);
      return;
    }
    try {
      const body: Record<string, unknown> = {
        title,
        clientMessage: clientMessage.trim() || null,
        internalNotes: internalNotes.trim() || null,
        priority,
        clientId: requesterClientId,
      };
      if (deviceId) body.deviceId = deviceId;
      const res = await apiFetch("/api/v1/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        const message = j?.error ?? "Falha ao criar ticket.";
        setError(message);
        showToast({ title: "Erro ao abrir ticket", description: message, variant: "error" });
        return;
      }
      onClose();
      router.refresh();
      showToast({
        title: "Ticket aberto",
        description: "Chamado criado com sucesso.",
        variant: "success",
      });
    } catch {
      setError("Nao foi possivel conectar a API.");
      showToast({
        title: "Erro ao abrir ticket",
        description: "Nao foi possivel conectar a API.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-ticket-title"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2
              id="new-ticket-title"
              className="text-lg font-semibold text-foreground"
            >
              Novo ticket
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Registre um chamado para a empresa cliente (solicitante obrigatorio).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-background hover:text-foreground"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="grid flex-1 gap-0 md:grid-cols-2">
            <div className="space-y-4 border-b border-border p-5 md:border-b-0 md:border-r">
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                  htmlFor="nt-requester"
                >
                  Solicitante (empresa)
                </label>
                <select
                  id="nt-requester"
                  required
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={requesterClientId}
                  onChange={(e) => setRequesterClientId(e.target.value)}
                >
                  <option value="">Selecione a empresa</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                  htmlFor="nt-title"
                >
                  Assunto
                </label>
                <input
                  id="nt-title"
                  required
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: VPN caiu no hotel X"
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                  htmlFor="nt-client-msg"
                >
                  Relato do solicitante
                </label>
                <p className="mt-0.5 text-[11px] text-muted">
                  Texto informado pelo cliente; nao pode ser alterado depois.
                </p>
                <textarea
                  id="nt-client-msg"
                  rows={4}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  placeholder="O que o cliente relatou..."
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                  htmlFor="nt-internal"
                >
                  Observacoes internas (opcional)
                </label>
                <textarea
                  id="nt-internal"
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas da equipe..."
                />
              </div>
              <div
                className="flex min-h-[100px] cursor-default flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/80 px-4 py-6 text-center text-sm text-muted"
                title="Upload em fase 2"
              >
                Anexos
                <span className="mt-1 text-xs">
                  Arraste arquivos aqui (em breve)
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                  htmlFor="nt-priority"
                >
                  Prioridade
                </label>
                <select
                  id="nt-priority"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Critica</option>
                </select>
              </div>
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide text-muted"
                  htmlFor="nt-device"
                >
                  Dispositivo
                </label>
                <select
                  id="nt-device"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.clientName} — {d.hostname}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset className="space-y-2 rounded-lg border border-border bg-background/70 p-3">
                <legend className="px-1 text-xs text-muted">
                  Em construcao
                </legend>
                <div className="text-sm text-muted">
                  <p>Tipo, Mesa e Analista ficam desabilitados ate o modelo.</p>
                  <input
                    disabled
                    className="mt-2 w-full cursor-not-allowed rounded border border-border bg-surface px-2 py-1.5 text-sm text-muted"
                    placeholder="Selecione a mesa antes"
                  />
                </div>
              </fieldset>
            </div>
          </div>

          {error ? (
            <p className="px-5 text-sm text-danger">{error}</p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-background/60 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-background"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Abrir ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
