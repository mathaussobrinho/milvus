"use client";

import { TicketStatusSelect } from "@/components/tickets/TicketStatusSelect";
import type { TicketRow } from "./ticketLabels";
import { priorityLabel, statusLabel } from "./ticketLabels";

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function priorityBadgeClass(p: string) {
  if (p === "high" || p === "critical")
    return "bg-danger/15 text-danger ring-1 ring-danger/30";
  return "bg-primary/10 text-primary ring-1 ring-primary/25";
}

type Props = {
  tickets: TicketRow[];
  onTicketOpen?: (ticket: TicketRow) => void;
};

export function TicketsList({ tickets, onTicketOpen }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-border bg-background uppercase tracking-wide text-muted">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 font-medium">ID</th>
            <th className="min-w-[200px] px-3 py-2 font-medium">Titulo</th>
            <th className="min-w-[120px] px-3 py-2 font-medium">Cliente</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Prioridade</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Status</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Criado</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Atualizado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="cursor-pointer hover:bg-background/80"
              onClick={() => onTicketOpen?.(t)}
            >
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-muted">
                #{shortId(t.id)}
              </td>
              <td className="px-3 py-2">
                <p className="max-w-md truncate text-sm font-medium">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                    {t.description}
                  </p>
                ) : null}
              </td>
              <td className="max-w-[160px] px-3 py-2 text-muted">
                <span className="line-clamp-2 text-[11px]">
                  {t.clientName ?? "—"}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityBadgeClass(t.priority)}`}
                >
                  {priorityLabel[t.priority] ?? t.priority}
                </span>
              </td>
              <td
                className="whitespace-nowrap px-3 py-2"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <TicketStatusSelect
                  ticketId={t.id}
                  current={t.status}
                  label={statusLabel[t.status] ?? t.status}
                />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">
                {new Date(t.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">
                {new Date(t.updatedAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
