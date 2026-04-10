"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InventarioFiltersStrip } from "@/components/inventario/InventarioFiltersStrip";
import { DeviceDetailModal } from "@/components/inventario/DeviceDetailModal";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DeviceRow = {
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
  lastOsBootAt: string | null;
};

type ClientOpt = { id: string; name: string };

type Props = {
  initialDevices: DeviceRow[];
  initialClients: ClientOpt[];
};

export function InventarioWorkspace({ initialDevices, initialClients }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<DeviceRow[]>(initialDevices);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setDevices(initialDevices);
  }, [initialDevices]);

  const filterClientId = useMemo(() => {
    const c = searchParams.get("client");
    if (c && uuidRe.test(c)) return c;
    return null;
  }, [searchParams]);

  const filterOnline = useMemo((): "all" | "online" | "offline" => {
    const o = searchParams.get("online");
    if (o === "online" || o === "offline") return o;
    return "all";
  }, [searchParams]);

  const filterSearchRaw = searchParams.get("q") ?? "";
  const filterSearch = filterSearchRaw.trim().toLowerCase();

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (filterClientId && d.clientId !== filterClientId) return false;
      if (filterOnline === "online" && !d.isOnline) return false;
      if (filterOnline === "offline" && d.isOnline) return false;
      if (filterSearch) {
        const hay = [
          d.clientName,
          d.hostname,
          d.ipAddress,
          d.macAddress,
          d.username,
          d.operatingSystem,
          d.antivirusSummary ?? "",
          d.cpuSummary ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(filterSearch)) return false;
      }
      return true;
    });
  }, [devices, filterClientId, filterOnline, filterSearch]);

  const hasActiveFilters = Boolean(
    filterClientId || filterOnline !== "all" || filterSearchRaw.trim(),
  );

  function navigateWithQuery(next: URLSearchParams) {
    const s = next.toString();
    router.replace(s ? `/inventario?${s}` : "/inventario", { scroll: false });
  }

  const setFilterClient = useCallback(
    (clientId: string | null) => {
      const q = new URLSearchParams(searchParams.toString());
      if (clientId) q.set("client", clientId);
      else q.delete("client");
      navigateWithQuery(q);
    },
    [searchParams, router],
  );

  const setFilterOnline = useCallback(
    (value: "all" | "online" | "offline") => {
      const q = new URLSearchParams(searchParams.toString());
      if (value === "all") q.delete("online");
      else q.set("online", value);
      navigateWithQuery(q);
    },
    [searchParams, router],
  );

  const setSearch = useCallback(
    (q: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (q.trim()) p.set("q", q);
      else p.delete("q");
      navigateWithQuery(p);
    },
    [searchParams, router],
  );

  const clearAll = useCallback(() => {
    navigateWithQuery(new URLSearchParams());
  }, [router]);

  function refreshList() {
    router.refresh();
  }

  return (
    <div className="flex-1 p-6">
      <InventarioFiltersStrip
        clients={initialClients}
        filterClientId={filterClientId}
        filterOnline={filterOnline}
        searchQuery={filterSearchRaw}
        onClientChange={setFilterClient}
        onOnlineChange={setFilterOnline}
        onSearchChange={setSearch}
        onClearAll={clearAll}
        hasActiveFilters={hasActiveFilters}
      />

      {devices.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum dispositivo. Execute o agente Windows para registrar esta maquina.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-background text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Dispositivo</th>
                <th className="px-4 py-3 font-medium">Processador</th>
                <th className="px-4 py-3 font-medium">Ultimo boot SO</th>
                <th className="px-4 py-3 font-medium">Alertas</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Ultima sync</th>
                <th className="px-4 py-3 font-medium">RAM / Disco / AV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer hover:bg-background/80"
                  onClick={() => setDetailId(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailId(d.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.isOnline
                          ? "bg-primary/15 text-primary"
                          : "bg-danger/15 text-danger"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          d.isOnline ? "bg-primary" : "bg-danger"
                        }`}
                      />
                      {d.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{d.clientName}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary">{d.hostname}</p>
                    <p className="text-xs text-muted">
                      {d.ipAddress} · {d.macAddress || "—"}
                    </p>
                    <p className="text-xs text-muted">
                      {d.username} · {d.operatingSystem}
                    </p>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-xs text-muted">
                    {d.cpuSummary ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {d.lastOsBootAt
                      ? new Date(d.lastOsBootAt).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {d.openAlertCount > 0 ? (
                      <span className="font-semibold text-danger">{d.openAlertCount}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{d.openTicketCount}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(d.lastSeenAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-muted">
                    {d.totalRamMb != null ? `${Math.round(d.totalRamMb / 1024)} GB RAM` : "—"}
                    {" · "}
                    {d.totalDiskGb != null ? `${d.totalDiskGb} GB` : "—"}
                    {" · "}
                    {d.antivirusSummary ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted">
              Nenhum dispositivo com os filtros atuais.
            </p>
          ) : null}
        </div>
      )}

      {detailId ? (
        <DeviceDetailModal
          deviceId={detailId}
          clients={initialClients}
          onClose={() => setDetailId(null)}
          onSaved={refreshList}
        />
      ) : null}
    </div>
  );
}
