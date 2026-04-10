"use client";

import { useEffect, useState } from "react";
import {
  formatAntivirusSummary,
  formatHardwareSummaryLine,
} from "@/components/inventario/hardwareSummary";
import { apiFetch } from "@/lib/client-api";
import { showToast } from "@/lib/toast";

type ClientOpt = { id: string; name: string };

type DeviceDetail = {
  id: string;
  clientId: string | null;
  clientName: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  username: string;
  operatingSystem: string;
  isOnline: boolean;
  openAlertCount: number;
  openTicketCount: number;
  lastSeenAt: string;
  totalRamMb: number | null;
  totalDiskGb: number | null;
  antivirusSummary: string | null;
  cpuSummary: string | null;
  gpuSummary: string | null;
  lastOsBootAt: string | null;
  notes: string | null;
  agentKey: string;
  createdAt: string;
};

type Props = {
  deviceId: string;
  clients: ClientOpt[];
  onClose: () => void;
  onSaved: () => void;
};

export function DeviceDetailModal({ deviceId, clients, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [clientName, setClientName] = useState("");
  const [hostname, setHostname] = useState("");
  const [username, setUsername] = useState("");
  const [clientId, setClientId] = useState<string>("");

  const clientLinkedByAgent = Boolean(detail?.clientId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/v1/devices/${deviceId}`);
        if (!res.ok) {
          if (!cancelled) setDetail(null);
          return;
        }
        const d = (await res.json()) as DeviceDetail;
        if (cancelled) return;
        setDetail(d);
        setClientName(d.clientName);
        setHostname(d.hostname);
        setUsername(d.username);
        setClientId(d.clientId ?? "");
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        clientName: clientName.trim(),
        hostname: hostname.trim(),
        username: username.trim(),
      };
      if (!clientLinkedByAgent) {
        const cid = clientId.trim();
        if (cid) body.clientId = cid;
        else body.clearClientId = true;
      }

      const res = await apiFetch(`/api/v1/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast({
          title: j?.error ?? "Nao foi possivel salvar.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Dispositivo atualizado.", variant: "success" });
      onSaved();
      onClose();
    } catch {
      showToast({ title: "Falha de rede.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        "Excluir este dispositivo do inventario? Chamados antigos mantem-se, mas deixam de referir esta maquina.",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/v1/devices/${deviceId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast({
          title: j?.error ?? "Nao foi possivel excluir.",
          variant: "error",
        });
        return;
      }
      showToast({ title: "Dispositivo excluido.", variant: "success" });
      onSaved();
      onClose();
    } catch {
      showToast({ title: "Falha de rede.", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const registeredClientLabel =
    detail?.clientId &&
    clients.find((c) => c.id === detail.clientId)?.name;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Dispositivo</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          >
            Fechar
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : !detail ? (
          <p className="text-sm text-danger">Nao foi possivel carregar.</p>
        ) : (
          <form onSubmit={onSave} className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-muted">
              <p>
                <span className="font-medium text-foreground">Status:</span>{" "}
                {detail.isOnline ? "Online" : "Offline"}
              </p>
              <p>
                <span className="font-medium text-foreground">Ultima sincronizacao:</span>{" "}
                {new Date(detail.lastSeenAt).toLocaleString("pt-BR")}
              </p>
              <p>
                <span className="font-medium text-foreground">Ultimo boot do SO:</span>{" "}
                {detail.lastOsBootAt
                  ? new Date(detail.lastOsBootAt).toLocaleString("pt-BR")
                  : "—"}
              </p>
              <p>
                <span className="font-medium text-foreground">SO:</span> {detail.operatingSystem}
              </p>
              <p>
                <span className="font-medium text-foreground">IP / MAC:</span> {detail.ipAddress}{" "}
                / {detail.macAddress || "—"}
              </p>
              <p className="break-words">
                <span className="font-medium text-foreground">
                  RAM · Disco · CPU · GPU:
                </span>{" "}
                {formatHardwareSummaryLine(detail)}
              </p>
              <p className="break-words">
                <span className="font-medium text-foreground">Antivirus:</span>{" "}
                {formatAntivirusSummary(detail)}
              </p>
              <p className="break-all">
                <span className="font-medium text-foreground">Agent key:</span> {detail.agentKey}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Cliente (cadastro)</label>
              {clientLinkedByAgent ? (
                <p className="mt-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-foreground">
                  {registeredClientLabel ?? detail.clientName}
                  <span className="mt-1 block text-xs text-muted">
                    Vinculado pela KEY do agente; nao pode ser alterado aqui.
                  </span>
                </p>
              ) : (
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">(sem cliente vinculado)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Nome exibido (cliente)</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Hostname</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                maxLength={150}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted">Utilizador</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting || saving}
                className="rounded-lg border border-danger/50 px-4 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir maquina"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
