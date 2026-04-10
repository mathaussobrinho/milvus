"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTicketsUi } from "@/components/tickets/TicketsUiContext";
import { TicketDetailModal } from "./TicketDetailModal";
import { TicketsGrid } from "./TicketsGrid";
import { TicketsKanban } from "./TicketsKanban";
import { TicketsList } from "./TicketsList";
import { ViewToggle } from "./ViewToggle";
import {
  VIEW_STORAGE_KEY,
  type TicketRow,
  type TicketsViewMode,
} from "./ticketLabels";

type Props = {
  initialTickets: TicketRow[] | null;
  apiBase: string;
};

function readStoredView(): TicketsViewMode {
  if (typeof window === "undefined") return "list";
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v === "kanban" || v === "grid" || v === "list") return v;
  } catch {
    /* ignore */
  }
  return "list";
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function TicketsWorkspace({ initialTickets, apiBase }: Props) {
  const { openNewTicket } = useTicketsUi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<TicketsViewMode>("list");
  const [tickets, setTickets] = useState<TicketRow[]>(initialTickets ?? []);
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);

  useEffect(() => {
    setView(readStoredView());
  }, []);

  useEffect(() => {
    if (initialTickets) setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    const tid = searchParams.get("ticket");
    if (tid && uuidRe.test(tid)) setDetailTicketId(tid);
  }, [searchParams]);

  function persistView(mode: TicketsViewMode) {
    setView(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  function closeDetail() {
    setDetailTicketId(null);
    const q = new URLSearchParams(searchParams.toString());
    q.delete("ticket");
    const s = q.toString();
    router.replace(s ? `/tickets?${s}` : "/tickets", { scroll: false });
  }

  function openDetail(id: string) {
    setDetailTicketId(id);
    const q = new URLSearchParams(searchParams.toString());
    q.set("ticket", id);
    router.replace(`/tickets?${q.toString()}`, { scroll: false });
  }

  if (!initialTickets) {
    return (
      <div className="flex-1 p-6">
        <p className="text-sm text-danger">
          Nao foi possivel carregar tickets. API em{" "}
          <code className="rounded bg-surface px-1">{apiBase}</code>
        </p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <ViewToggle value={view} onChange={persistView} />
        </div>
        <p className="text-sm text-muted">
          Nenhum ticket ainda.{" "}
          <button
            type="button"
            onClick={openNewTicket}
            className="text-primary hover:underline"
          >
            Abrir o primeiro
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ViewToggle value={view} onChange={persistView} />
        <p className="text-xs text-muted">
          {tickets.length} ticket(s) · preferencia salva neste navegador
        </p>
      </div>

      {view === "list" ? (
        <TicketsList
          tickets={tickets}
          onTicketOpen={(t) => openDetail(t.id)}
        />
      ) : null}
      {view === "kanban" ? (
        <TicketsKanban
          tickets={tickets}
          onTicketsChange={setTickets}
          onTicketOpen={(t) => openDetail(t.id)}
        />
      ) : null}
      {view === "grid" ? (
        <TicketsGrid
          tickets={tickets}
          onTicketOpen={(t) => openDetail(t.id)}
        />
      ) : null}

      <TicketDetailModal ticketId={detailTicketId} onClose={closeDetail} />
    </div>
  );
}
