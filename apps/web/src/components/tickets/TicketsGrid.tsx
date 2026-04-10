"use client";

import { TicketCard } from "./TicketCard";
import type { TicketRow } from "./ticketLabels";

type Props = {
  tickets: TicketRow[];
  onTicketOpen?: (ticket: TicketRow) => void;
};

export function TicketsGrid({ tickets, onTicketOpen }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {tickets.map((t) => (
        <TicketCard
          key={t.id}
          ticket={t}
          onOpen={onTicketOpen ? () => onTicketOpen(t) : undefined}
        />
      ))}
    </div>
  );
}
