"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { apiFetch } from "@/lib/client-api";
import { TicketCard } from "./TicketCard";
import {
  KANBAN_COLUMNS,
  apiStatusFromDropColumn,
  columnForStatus,
  type TicketRow,
} from "./ticketLabels";

function colDroppableId(columnId: string) {
  return `col:${columnId}`;
}

function resolveDropColumn(
  overId: string | number | null | undefined,
  tickets: TicketRow[],
): string | null {
  if (overId == null) return null;
  const s = String(overId);
  if (s.startsWith("col:")) return s.slice(4);
  const t = tickets.find((x) => x.id === s);
  return t ? columnForStatus(t.status) : null;
}

function KanbanColumn({
  columnId,
  title,
  tickets,
  onTicketOpen,
}: {
  columnId: string;
  title: string;
  tickets: TicketRow[];
  onTicketOpen?: (ticket: TicketRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: colDroppableId(columnId),
  });

  const headerAccent =
    columnId === "done"
      ? "border-l-primary"
      : columnId === "in_progress"
        ? "border-l-blue-500"
        : "border-l-danger";

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] min-w-[260px] flex-1 flex-col rounded-xl border border-border bg-surface p-3 ${
        isOver ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div
        className={`mb-3 border-l-4 ${headerAccent} bg-background/90 px-2 py-2 pl-3`}
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted">{tickets.length} tickets</p>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tickets.map((t) => (
          <DraggableTicket
            key={t.id}
            ticket={t}
            onOpen={onTicketOpen ? () => onTicketOpen(t) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTicket({
  ticket,
  onOpen,
}: {
  ticket: TicketRow;
  onOpen?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ticket.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <TicketCard
      ticket={ticket}
      onOpen={onOpen}
      dragProps={{
        ref: setNodeRef,
        style: style ?? {},
        listeners,
        attributes,
        isDragging,
      }}
    />
  );
}

type Props = {
  tickets: TicketRow[];
  onTicketsChange: (next: TicketRow[]) => void;
  onTicketOpen?: (ticket: TicketRow) => void;
};

export function TicketsKanban({
  tickets,
  onTicketsChange,
  onTicketOpen,
}: Props) {
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byColumn = useMemo(() => {
    const map: Record<string, TicketRow[]> = {
      open: [],
      in_progress: [],
      waiting: [],
      done: [],
    };
    for (const t of tickets) {
      const c = columnForStatus(t.status);
      map[c]?.push(t);
    }
    return map;
  }, [tickets]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const ticketId = String(active.id);
    const ticket = tickets.find((x) => x.id === ticketId);
    if (!ticket) return;

    const targetCol = resolveDropColumn(over?.id, tickets);
    if (!targetCol) return;

    const nextStatus = apiStatusFromDropColumn(targetCol, ticket.status);
    if (!nextStatus || nextStatus === ticket.status) return;

    const prev = tickets;
    const optimistic = tickets.map((x) =>
      x.id === ticketId
        ? { ...x, status: nextStatus, updatedAt: new Date().toISOString() }
        : x,
    );
    onTicketsChange(optimistic);

    try {
      const res = await apiFetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("patch failed");
      router.refresh();
    } catch {
      onTicketsChange(prev);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:overflow-x-auto">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            title={col.title}
            tickets={byColumn[col.id] ?? []}
            onTicketOpen={onTicketOpen}
          />
        ))}
      </div>
    </DndContext>
  );
}
