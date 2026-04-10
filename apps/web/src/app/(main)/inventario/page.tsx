import { AppHeader } from "@/components/shell/AppHeader";
import { fetchJson, getApiBase } from "@/lib/api";

type DeviceRow = {
  id: string;
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
};

export default async function InventarioPage() {
  const rows = await fetchJson<DeviceRow[]>("/api/v1/devices");
  const apiBase = getApiBase();

  return (
    <>
      <AppHeader
        title="Inventario"
        subtitle="Dispositivos reportados pelo agente ou cadastro manual futuro."
      />
      <div className="flex-1 p-6">
        {!rows ? (
          <p className="text-sm text-danger">
            Nao foi possivel carregar dispositivos. API em{" "}
            <code className="rounded bg-surface px-1">{apiBase}</code>
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhum dispositivo. Execute o agente Windows para registrar esta
            maquina automaticamente.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Dispositivo</th>
                  <th className="px-4 py-3 font-medium">Alertas</th>
                  <th className="px-4 py-3 font-medium">Tickets</th>
                  <th className="px-4 py-3 font-medium">Ultima atualizacao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-background/80">
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
                    <td className="px-4 py-3">
                      {d.openAlertCount > 0 ? (
                        <span className="font-semibold text-danger">
                          {d.openAlertCount}
                        </span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{d.openTicketCount}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(d.lastSeenAt).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
