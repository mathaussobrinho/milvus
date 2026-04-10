import { fetchJson } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { ClientesManager, type ClientRow } from "./ClientesManager";

export default async function ClientesPage() {
  const rows = await fetchJson<ClientRow[]>("/api/v1/clients");
  const apiBase = getApiBase();

  if (!rows) {
    return (
      <div className="p-6">
        <p className="text-sm text-danger">
          Nao foi possivel carregar clientes. API em{" "}
          <code className="rounded bg-surface px-1">{apiBase}</code>
        </p>
      </div>
    );
  }

  return <ClientesManager initial={rows} />;
}
