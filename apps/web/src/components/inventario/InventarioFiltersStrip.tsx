"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ClientOpt = { id: string; name: string };

type DropdownId = "client" | "online" | null;

type Props = {
  clients: ClientOpt[];
  filterClientId: string | null;
  filterOnline: "all" | "online" | "offline";
  searchQuery: string;
  onClientChange: (clientId: string | null) => void;
  onOnlineChange: (value: "all" | "online" | "offline") => void;
  onSearchChange: (q: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

export function InventarioFiltersStrip({
  clients,
  filterClientId,
  filterOnline,
  searchQuery,
  onClientChange,
  onOnlineChange,
  onSearchChange,
  onClearAll,
  hasActiveFilters,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<DropdownId>(null);
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    if (open !== "client") setClientSearch("");
  }, [open]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [clients],
  );

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return sortedClients;
    return sortedClients.filter((c) => c.name.toLowerCase().includes(q));
  }, [sortedClients, clientSearch]);

  const clientLabel = useMemo(() => {
    if (!filterClientId) return "Clientes";
    const c = clients.find((x) => x.id === filterClientId);
    if (!c) return "Clientes";
    return c.name.length > 18 ? `${c.name.slice(0, 16)}…` : c.name;
  }, [clients, filterClientId]);

  const onlineLabel =
    filterOnline === "online"
      ? "Online"
      : filterOnline === "offline"
        ? "Offline"
        : "Conectividade";

  const triggerClass =
    "flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-background";

  const itemClass = (active: boolean) =>
    `block w-full px-3 py-2 text-left text-sm ${
      active
        ? "bg-primary/10 font-medium text-primary"
        : "text-foreground/90 hover:bg-background"
    }`;

  function toggle(next: Exclude<DropdownId, null>) {
    setOpen((o) => (o === next ? null : next));
  }

  function selectClient(id: string | null) {
    onClientChange(id);
    setOpen(null);
  }

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
              onClick={() => toggle("client")}
            >
              <span className={filterClientId ? "text-foreground" : "text-muted"}>
                {clientLabel}
              </span>
              <span className="text-primary" aria-hidden>
                {open === "client" ? "▲" : "▼"}
              </span>
            </button>
            {open === "client" ? (
              <div className="absolute left-0 z-50 mt-1 max-h-72 min-w-[240px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
                <div className="border-b border-border bg-background/60 p-2">
                  <input
                    type="search"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Pesquisar"
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  <button
                    type="button"
                    className={itemClass(!filterClientId)}
                    onClick={() => selectClient(null)}
                  >
                    Todos os clientes
                  </button>
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={itemClass(filterClientId === c.id)}
                      onClick={() => selectClient(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                  {filteredClients.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted">Nenhum resultado</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              className={triggerClass}
              aria-expanded={open === "online"}
              onClick={() => toggle("online")}
            >
              <span className={filterOnline !== "all" ? "text-foreground" : "text-muted"}>
                {onlineLabel}
              </span>
              <span className="text-primary" aria-hidden>
                {open === "online" ? "▲" : "▼"}
              </span>
            </button>
            {open === "online" ? (
              <div className="absolute left-0 z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-surface py-1 shadow-lg">
                {(
                  [
                    ["all", "Todos"],
                    ["online", "Somente online"],
                    ["offline", "Somente offline"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={itemClass(filterOnline === key)}
                    onClick={() => {
                      onOnlineChange(key);
                      setOpen(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
