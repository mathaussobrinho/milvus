"use client";

import { createContext, useContext } from "react";

export type TicketsUiValue = {
  openNewTicket: () => void;
};

export const TicketsUiContext = createContext<TicketsUiValue | null>(null);

export function useTicketsUi() {
  const ctx = useContext(TicketsUiContext);
  if (!ctx) {
    throw new Error("useTicketsUi deve ser usado dentro do modulo Tickets");
  }
  return ctx;
}
