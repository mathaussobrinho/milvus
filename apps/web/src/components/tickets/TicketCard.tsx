"use client";

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { CSSProperties } from "react";
import type { TicketRow } from "./ticketLabels";
import { priorityLabel, statusLabel } from "./ticketLabels";

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function priorityClass(p: string) {
  if (p === "high" || p === "critical")
    return "border-danger/40 bg-danger/15 text-danger";
  if (p === "medium") return "border-primary/40 bg-primary/15 text-primary";
  return "border-border bg-background text-foreground/80";
}

type DragProps = {
  ref: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  listeners?: DraggableSyntheticListeners;
  attributes?: DraggableAttributes;
  isDragging?: boolean;
};

type Props = {
  ticket: TicketRow;
  dragProps?: DragProps;
  onOpen?: () => void;
};

function CardInner({ ticket }: { ticket: TicketRow }) {
  const dt = (s: string) =>
    new Date(s).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <p className="font-mono text-[11px] text-muted">#{shortId(ticket.id)}</p>
      <p className="mt-1 line-clamp-2 font-medium leading-snug">{ticket.title}</p>
      {ticket.clientName ? (
        <p className="mt-1 truncate text-[11px] text-muted">{ticket.clientName}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priorityClass(ticket.priority)}`}
        >
          {priorityLabel[ticket.priority] ?? ticket.priority}
        </span>
        <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-foreground/75">
          {statusLabel[ticket.status] ?? ticket.status}
        </span>
      </div>
      <p className="mt-2 text-[10px] text-muted">
        {dt(ticket.createdAt)} · {dt(ticket.updatedAt)}
      </p>
    </>
  );
}

export function TicketCard({ ticket, dragProps, onOpen }: Props) {
  const shellClass = `rounded-lg border border-border bg-surface text-left text-sm text-foreground shadow-sm ${
    dragProps?.isDragging ? "opacity-60 ring-2 ring-primary/50" : ""
  }`;

  if (dragProps?.listeners) {
    return (
      <div
        ref={dragProps.ref}
        style={dragProps.style}
        className={`flex gap-1.5 p-2 ${shellClass}`}
      >
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded border border-border bg-background px-1 py-2 text-[10px] leading-none text-muted hover:bg-primary/5 hover:text-foreground active:cursor-grabbing"
          {...dragProps.listeners}
          {...dragProps.attributes}
          aria-label="Arrastar ticket"
        >
          ⋮⋮
        </button>
        <div
          className="min-w-0 flex-1 cursor-pointer rounded-md py-1 pl-0.5 pr-1 outline-none hover:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-primary/50"
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen?.();
            }
          }}
          role={onOpen ? "button" : undefined}
          tabIndex={onOpen ? 0 : undefined}
        >
          <CardInner ticket={ticket} />
        </div>
      </div>
    );
  }

  return (
    <article
      className={`cursor-pointer p-3 transition-colors hover:bg-primary/[0.04] ${shellClass}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <CardInner ticket={ticket} />
    </article>
  );
}
