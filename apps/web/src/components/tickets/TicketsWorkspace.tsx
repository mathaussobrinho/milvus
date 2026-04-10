"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTicketsUi } from "@/components/tickets/TicketsUiContext";
import { TicketDetailModal } from "./TicketDetailModal";
import { TicketsGrid } from "./TicketsGrid";
import { TicketsKanban } from "./TicketsKanban";
import { TicketsList } from "./TicketsList";
import { ViewToggle } from "./ViewToggle";
import {
  TICKET_FILTER_ASSIGNEE_NONE,
  TicketsFiltersStrip,
} from "./TicketsFiltersStrip";
import {
  VIEW_STORAGE_KEY,
  type TicketRow,
  type TicketsViewMode,
} from "./ticketLabels";

type Props = {
  initialTickets: TicketRow[] | null;
  initialClients: { id: string; name: string }[];
  initialAnalysts: { id: string; name: string }[];
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

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function TicketsWorkspace({
  initialTickets,
  initialClients,
  initialAnalysts,
  apiBase,
}: Props) {
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

  const filterClientId = useMemo(() => {
    const c = searchParams.get("client");
    if (c && uuidRe.test(c)) return c;
    return null;
  }, [searchParams]);

  const filterAssignee = useMemo(() => {
    const a = searchParams.get("assignee");
    if (a === "none") return TICKET_FILTER_ASSIGNEE_NONE;
    if (a && uuidRe.test(a)) return a;
    return null;
  }, [searchParams]);

  const filterStatus = useMemo(() => {
    const s = searchParams.get("status");
    if (!s) return null;
    const allowed = [
      "open",
      "in_progress",
      "waiting",
      "resolved",
      "closed",
    ] as const;
    if ((allowed as readonly string[]).includes(s)) return s;
    return null;
  }, [searchParams]);

  const filterSearchRaw = searchParams.get("q") ?? "";
  const filterSearch = filterSearchRaw.trim().toLowerCase();

  const mergeVisibleTicketUpdates = useCallback((partial: TicketRow[]) => {
    setTickets((prev) => {
      const map = new Map(partial.map((t) => [t.id, t]));
      return prev.map((t) => map.get(t.id) ?? t);
    });
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterClientId && t.clientId !== filterClientId) return false;
      if (filterAssignee === TICKET_FILTER_ASSIGNEE_NONE) {
        if (t.assigneeAnalystId) return false;
      } else if (filterAssignee && t.assigneeAnalystId !== filterAssignee) {
        return false;
      }
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterSearch) {
        const idCompact = t.id.replace(/-/g, "").toLowerCase();
        const idShort = idCompact.slice(0, 8);
        const hay = [
          t.title,
          t.description ?? "",
          t.clientName ?? "",
          t.assigneeName ?? "",
          idShort,
          idCompact,
          t.id.toLowerCase(),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(filterSearch)) return false;
      }
      return true;
    });
  }, [
    tickets,
    filterClientId,
    filterAssignee,
    filterStatus,
    filterSearch,
  ]);

  const hasActiveFilters = Boolean(
    filterClientId ||
      filterAssignee ||
      filterStatus ||
      filterSearchRaw.trim(),
  );

  function navigateWithTicketQuery(next: URLSearchParams) {
    const s = next.toString();
    router.replace(s ? `/tickets?${s}` : "/tickets", { scroll: false });
  }

  function setFilterClient(clientId: string | null) {
    const q = new URLSearchParams(searchParams.toString());
    if (clientId) q.set("client", clientId);
    else q.delete("client");
    navigateWithTicketQuery(q);
  }

  function setFilterAssignee(value: string | null) {
    const q = new URLSearchParams(searchParams.toString());
    if (value === TICKET_FILTER_ASSIGNEE_NONE) q.set("assignee", "none");
    else if (value) q.set("assignee", value);
    else q.delete("assignee");
    navigateWithTicketQuery(q);
  }

  function setFilterStatus(status: string | null) {
    const q = new URLSearchParams(searchParams.toString());
    if (status) q.set("status", status);
    else q.delete("status");
    navigateWithTicketQuery(q);
  }

  function clearAllFilters() {
    const q = new URLSearchParams(searchParams.toString());
    q.delete("client");
    q.delete("assignee");
    q.delete("status");
    q.delete("q");
    navigateWithTicketQuery(q);
  }

  function setFilterSearch(value: string) {
    const q = new URLSearchParams(searchParams.toString());
    const t = value.trim();
    if (t) q.set("q", t);
    else q.delete("q");
    navigateWithTicketQuery(q);
  }

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
    navigateWithTicketQuery(q);
  }

  function openDetail(id: string) {
    setDetailTicketId(id);
    const q = new URLSearchParams(searchParams.toString());
    q.set("ticket", id);
    navigateWithTicketQuery(q);
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

  const countLabel =
    filteredTickets.length === tickets.length
      ? `${tickets.length} ticket(s)`
      : `${filteredTickets.length} de ${tickets.length} ticket(s)`;

  return (
    <div className="flex-1 p-6">
      <TicketsFiltersStrip
        clients={initialClients}
        analysts={initialAnalysts}
        filterClientId={filterClientId}
        filterAssignee={filterAssignee}
        filterStatus={filterStatus}
        searchQuery={filterSearchRaw}
        onClientChange={setFilterClient}
        onAssigneeChange={setFilterAssignee}
        onStatusChange={setFilterStatus}
        onSearchChange={setFilterSearch}
        onClearAll={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ViewToggle value={view} onChange={persistView} />
        <p className="text-xs text-muted">
          {countLabel} · preferencia salva neste navegador
        </p>
      </div>

      {filteredTickets.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum ticket corresponde aos filtros selecionados.{" "}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-primary hover:underline"
            >
              Limpar
            </button>
          ) : null}
        </p>
      ) : null}

      {filteredTickets.length > 0 && view === "list" ? (
        <TicketsList
          tickets={filteredTickets}
          onTicketOpen={(t) => openDetail(t.id)}
        />
      ) : null}
      {filteredTickets.length > 0 && view === "kanban" ? (
        <TicketsKanban
          tickets={filteredTickets}
          onTicketsChange={mergeVisibleTicketUpdates}
          onTicketOpen={(t) => openDetail(t.id)}
        />
      ) : null}
      {filteredTickets.length > 0 && view === "grid" ? (
        <TicketsGrid
          tickets={filteredTickets}
          onTicketOpen={(t) => openDetail(t.id)}
        />
      ) : null}

      <TicketDetailModal ticketId={detailTicketId} onClose={closeDetail} />
    </div>
  );
}
