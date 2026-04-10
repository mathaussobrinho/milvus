export const priorityLabel: Record<string, string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  critical: "Critica",
};

export const statusLabel: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

export type TicketRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  clientId: string | null;
  clientName: string | null;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const VIEW_STORAGE_KEY = "visohelp:tickets:view";

export type TicketsViewMode = "list" | "kanban" | "grid";

export const KANBAN_COLUMNS = [
  { id: "open", title: "A fazer", status: "open" as const },
  { id: "in_progress", title: "Atendendo", status: "in_progress" as const },
  { id: "waiting", title: "Pausado / Aguardando", status: "waiting" as const },
  { id: "done", title: "Finalizado", status: "done" as const },
] as const;

/** Coluna Kanban de destino -> status na API (null = sem alteração). */
export function apiStatusFromDropColumn(
  columnId: string,
  currentStatus: string,
): string | null {
  if (columnId === "done") {
    if (currentStatus === "resolved" || currentStatus === "closed") return null;
    return "resolved";
  }
  if (columnId === currentStatus) return null;
  return columnId;
}

export function columnForStatus(status: string): string {
  if (status === "resolved" || status === "closed") return "done";
  if (status === "open") return "open";
  if (status === "in_progress") return "in_progress";
  if (status === "waiting") return "waiting";
  return "open";
}
