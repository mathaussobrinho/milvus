"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { statusLabel } from "@/components/tickets/ticketLabels";

export const TICKET_FILTER_ASSIGNEE_NONE = "__none__";

type ClientOpt = { id: string; name: string };
type AnalystOpt = { id: string; name: string };

type Props = {
  clients: ClientOpt[];
  analysts: AnalystOpt[];
  filterClientId: string | null;
  filterAssignee: string | null;
  filterStatus: string | null;
  searchQuery: string;
  onClientChange: (clientId: string | null) => void;
  onAssigneeChange: (value: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onSearchChange: (q: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
};

const STATUS_KEYS = Object.keys(statusLabel) as (keyof typeof statusLabel)[];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

type DropdownId = "client" | "analyst" | "status" | null;

export function TicketsFiltersStrip({
  clients,
  analysts,
  filterClientId,
  filterAssignee,
  filterStatus,
  searchQuery,
  onClientChange,
  onAssigneeChange,
  onStatusChange,
  onSearchChange,
  onClearAll,
  hasActiveFilters,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<DropdownId>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [analystSearch, setAnalystSearch] = useState("");

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    if (open !== "client") setClientSearch("");
    if (open !== "analyst") setAnalystSearch("");
  }, [open]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [clients],
  );
  const sortedAnalysts = useMemo(
    () => [...analysts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [analysts],
  );

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return sortedClients;
    return sortedClients.filter((c) => c.name.toLowerCase().includes(q));
  }, [sortedClients, clientSearch]);

  const filteredAnalysts = useMemo(() => {
    const q = analystSearch.trim().toLowerCase();
    if (!q) return sortedAnalysts;
    return sortedAnalysts.filter((a) => a.name.toLowerCase().includes(q));
  }, [sortedAnalysts, analystSearch]);

  const clientLabel = useMemo(() => {
    if (!filterClientId) return "Clientes";
    const c = clients.find((x) => x.id === filterClientId);
    if (!c) return "Clientes";
    const short =
      c.name.length > 18 ? `${c.name.slice(0, 16)}…` : c.name;
    return short;
  }, [clients, filterClientId]);

  const analystLabel = useMemo(() => {
    if (!filterAssignee) return "Analista";
    if (filterAssignee === TICKET_FILTER_ASSIGNEE_NONE) return "Sem responsavel";
    const a = analysts.find((x) => x.id === filterAssignee);
    if (!a) return "Analista";
    const short =
      a.name.length > 16 ? `${a.name.slice(0, 14)}…` : a.name;
    return short;
  }, [analysts, filterAssignee]);

  const statusLabelShort = useMemo(() => {
    if (!filterStatus) return "Status";
    return statusLabel[filterStatus] ?? filterStatus;
  }, [filterStatus]);

  function toggle(next: Exclude<DropdownId, null>) {
    setOpen((o) => (o === next ? null : next));
  }

  function selectClient(id: string | null) {
    onClientChange(id);
    setOpen(null);
  }

  function selectAssignee(value: string | null) {
    onAssigneeChange(value);
    setOpen(null);
  }

  function selectStatus(s: string | null) {
    onStatusChange(s);
    setOpen(null);
  }

  const triggerClass =
    "flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-background";

  const itemClass = (active: boolean) =>
    `block w-full px-3 py-2 text-left text-sm ${
      active
        ? "bg-primary/10 font-medium text-primary"
        : "text-foreground/90 hover:bg-background"
    }`;

  return (
    <div ref={barRef} className="relative mb-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm">
        <div className="flex h-8 w-38 max-w-[min(100%,11rem)] shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 sm:w-44">
          <SearchIcon className="size-3.5 shrink-0 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar"
            className="min-w-0 w-full bg-transparent text-xs text-foreground placeholder:text-muted outline-none"
            autoComplete="off"
          />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-0.5 sm:gap-1">
          <div className="relative">
            <button
              type="button"
              className={triggerClass}
              aria-expanded={open === "client"}
              aria-haspopup="listbox"
              onClick={() => toggle("client")}
            >
              <span
                className={
                  filterClientId ? "text-foreground" : "text-muted"
                }
              >
                {clientLabel}
              </span>
              <span className="text-primary" aria-hidden>
                {open === "client" ? "▲" : "▼"}
              </span>
            </button>
            {open === "client" ? (
              <div
                className="absolute left-0 z-50 mt-1 max-h-72 min-w-[240px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
                role="listbox"
              >
                <div className="border-b border-border bg-background/60 p-2">
                  <input
                    type="search"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Pesquisar"
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  <button
                    type="button"
                    role="option"
                    className={itemClass(!filterClientId)}
                    onClick={() => selectClient(null)}
                  >
                    Todos os clientes
                  </button>
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      className={itemClass(filterClientId === c.id)}
                      onClick={() => selectClient(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                  {filteredClients.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted">
                      Nenhum resultado
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              className={triggerClass}
              aria-expanded={open === "analyst"}
              aria-haspopup="listbox"
              onClick={() => toggle("analyst")}
            >
              <span
                className={
                  filterAssignee ? "text-foreground" : "text-muted"
                }
              >
                {analystLabel}
              </span>
              <span className="text-primary" aria-hidden>
                {open === "analyst" ? "▲" : "▼"}
              </span>
            </button>
            {open === "analyst" ? (
              <div
                className="absolute left-0 z-50 mt-1 max-h-80 min-w-[260px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
                role="listbox"
              >
                <div className="border-b border-border bg-background/60 p-2">
                  <input
                    type="search"
                    value={analystSearch}
                    onChange={(e) => setAnalystSearch(e.target.value)}
                    placeholder="Pesquisar"
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  <button
                    type="button"
                    role="option"
                    className={itemClass(!filterAssignee)}
                    onClick={() => selectAssignee(null)}
                  >
                    Todos os analistas
                  </button>
                  <button
                    type="button"
                    role="option"
                    className={itemClass(
                      filterAssignee === TICKET_FILTER_ASSIGNEE_NONE,
                    )}
                    onClick={() =>
                      selectAssignee(TICKET_FILTER_ASSIGNEE_NONE)
                    }
                  >
                    Sem responsavel
                  </button>
                  {filteredAnalysts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="option"
                      className={itemClass(filterAssignee === a.id)}
                      onClick={() => selectAssignee(a.id)}
                    >
                      {a.name}
                    </button>
                  ))}
                  {filteredAnalysts.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted">
                      Nenhum resultado
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              className={triggerClass}
              aria-expanded={open === "status"}
              aria-haspopup="listbox"
              onClick={() => toggle("status")}
            >
              <span
                className={filterStatus ? "text-foreground" : "text-muted"}
              >
                {statusLabelShort}
              </span>
              <span className="text-primary" aria-hidden>
                {open === "status" ? "▲" : "▼"}
              </span>
            </button>
            {open === "status" ? (
              <div
                className="absolute right-0 z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg sm:left-0 sm:right-auto"
                role="listbox"
              >
                <div className="max-h-64 overflow-y-auto py-1">
                  <button
                    type="button"
                    role="option"
                    className={itemClass(!filterStatus)}
                    onClick={() => selectStatus(null)}
                  >
                    Todos os status
                  </button>
                  {STATUS_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      className={itemClass(filterStatus === key)}
                      onClick={() => selectStatus(key)}
                    >
                      {statusLabel[key]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto shrink-0 rounded-md px-2 py-2 text-xs font-medium text-primary hover:bg-primary/10"
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}
