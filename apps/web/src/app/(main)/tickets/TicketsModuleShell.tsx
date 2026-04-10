"use client";

import { AppHeader } from "@/components/shell/AppHeader";
import { NewTicketModal } from "@/components/tickets/NewTicketModal";
import { TicketsUiContext } from "@/components/tickets/TicketsUiContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function TicketsModuleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      setNewOpen(true);
    }
  }, [searchParams]);

  const openNewTicket = useCallback(() => {
    setNewOpen(true);
    const q = new URLSearchParams(searchParams.toString());
    q.set("novo", "1");
    router.replace(`/tickets?${q.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const closeNewTicket = useCallback(() => {
    setNewOpen(false);
    const q = new URLSearchParams(searchParams.toString());
    q.delete("novo");
    const s = q.toString();
    router.replace(s ? `/tickets?${s}` : "/tickets", { scroll: false });
  }, [router, searchParams]);

  const value = useMemo(() => ({ openNewTicket }), [openNewTicket]);

  return (
    <TicketsUiContext.Provider value={value}>
      <AppHeader
        title="Tickets"
        subtitle="Chamados registrados no VisoHelp."
        action={
          <button
            type="button"
            onClick={openNewTicket}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Novo ticket
          </button>
        }
      />
      {children}
      <NewTicketModal open={newOpen} onClose={closeNewTicket} />
    </TicketsUiContext.Provider>
  );
}
