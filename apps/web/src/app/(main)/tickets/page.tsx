import { Suspense } from "react";
import { fetchJson } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { TicketsWorkspace } from "@/components/tickets/TicketsWorkspace";
import type { TicketRow } from "@/components/tickets/ticketLabels";

function normalizeTicketRow(r: TicketRow): TicketRow {
  return {
    ...r,
    assigneeAnalystId: r.assigneeAnalystId ?? null,
    assigneeName: r.assigneeName ?? null,
  };
}

export default async function TicketsPage() {
  const [rows, clientsRaw, analystsRaw] = await Promise.all([
    fetchJson<TicketRow[]>("/api/v1/tickets"),
    fetchJson<{ id: string; name: string }[]>("/api/v1/clients"),
    fetchJson<{ id: string; name: string }[]>("/api/v1/analysts"),
  ]);
  const apiBase = getApiBase();

  const initialTickets = rows?.map(normalizeTicketRow) ?? null;
  const initialClients = (clientsRaw ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const initialAnalysts = (analystsRaw ?? []).map((a) => ({
    id: a.id,
    name: a.name,
  }));

  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 text-sm text-muted">Carregando tickets...</div>
      }
    >
      <TicketsWorkspace
        initialTickets={initialTickets}
        initialClients={initialClients}
        initialAnalysts={initialAnalysts}
        apiBase={apiBase}
      />
    </Suspense>
  );
}
