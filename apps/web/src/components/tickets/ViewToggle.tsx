"use client";

import type { TicketsViewMode } from "./ticketLabels";

type Props = {
  value: TicketsViewMode;
  onChange: (mode: TicketsViewMode) => void;
};

const modes: { id: TicketsViewMode; label: string; icon: string }[] = [
  { id: "list", label: "Lista", icon: "≡" },
  { id: "kanban", label: "Kanban", icon: "▦" },
  { id: "grid", label: "Grid", icon: "▤" },
];

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-sm"
      role="group"
      aria-label="Modo de visualizacao"
    >
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          title={m.label}
          className={`flex min-w-[2.5rem] items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
            value === m.id
              ? "bg-primary text-white"
              : "text-foreground/70 hover:bg-background hover:text-foreground"
          }`}
        >
          <span className="sr-only">{m.label}</span>
          <span aria-hidden className="font-mono text-base leading-none">
            {m.icon}
          </span>
        </button>
      ))}
    </div>
  );
}
