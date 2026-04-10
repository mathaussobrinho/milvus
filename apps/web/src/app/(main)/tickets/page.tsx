import { Suspense } from "react";
import { fetchJson } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { TicketsWorkspace } from "@/components/tickets/TicketsWorkspace";
import type { TicketRow } from "@/components/tickets/ticketLabels";

export default async function TicketsPage() {
  const rows = await fetchJson<TicketRow[]>("/api/v1/tickets");
  const apiBase = getApiBase();

  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 text-sm text-muted">Carregando tickets...</div>
      }
    >
      <TicketsWorkspace initialTickets={rows} apiBase={apiBase} />
    </Suspense>
  );
}
