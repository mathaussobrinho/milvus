"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { showToast } from "@/lib/toast";
import { isTerminalStatus } from "./ticketLabels";

const options = [
  { value: "open", label: "Aberto" },
  { value: "in_progress", label: "Em andamento" },
  { value: "waiting", label: "Aguardando" },
  { value: "resolved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

export function TicketStatusSelect({
  ticketId,
  current,
  label,
}: {
  ticketId: string;
  current: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  /** Valor exibido: so muda apos PATCH OK ou quando o servidor atualiza `current`. */
  const [value, setValue] = useState(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  async function onChange(next: string) {
    if (next === value) return;
    if (isTerminalStatus(current) && !isTerminalStatus(next)) {
      showToast({
        title: "Chamado encerrado nao pode ser reaberto.",
        variant: "error",
      });
      return;
    }
    setPending(true);
    try {
      const res = await apiFetch(`/api/v1/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast({
          title: j?.error ?? "Nao foi possivel alterar o status.",
          variant: "error",
        });
        return;
      }
      setValue(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      className="w-full max-w-[200px] rounded-lg border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
      value={value}
      disabled={pending}
      onChange={(e) => void onChange(e.target.value)}
      aria-label={`Status do ticket ${label}`}
    >
      {options.map((o) => (
        <option
          key={o.value}
          value={o.value}
          disabled={isTerminalStatus(current) && !isTerminalStatus(o.value)}
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}
