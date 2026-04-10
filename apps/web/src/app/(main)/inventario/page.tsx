import { Suspense } from "react";
import { AppHeader } from "@/components/shell/AppHeader";
import { InventarioWorkspace } from "@/components/inventario/InventarioWorkspace";
import { fetchJson, getApiBase } from "@/lib/api";

export default async function InventarioPage() {
  const [rows, clientsRaw] = await Promise.all([
    fetchJson<
      {
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
      }[]
    >("/api/v1/devices"),
    fetchJson<{ id: string; name: string }[]>("/api/v1/clients"),
  ]);
  const apiBase = getApiBase();

  const initialClients = (clientsRaw ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <>
      <AppHeader
        title="Inventario"
        subtitle="Dispositivos reportados pelo agente ou cadastro manual futuro."
      />
      {!rows ? (
        <div className="flex-1 p-6">
          <p className="text-sm text-danger">
            Nao foi possivel carregar dispositivos. API em{" "}
            <code className="rounded bg-surface px-1">{apiBase}</code>
          </p>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex-1 p-6 text-sm text-muted">Carregando inventario...</div>
          }
        >
          <InventarioWorkspace initialDevices={rows} initialClients={initialClients} />
        </Suspense>
      )}
    </>
  );
}
