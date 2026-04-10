"use client";

import Link from "next/link";
import { priorityLabel, statusLabel } from "@/components/tickets/ticketLabels";

export type ClientDetail = {
  id: string;
  name: string;
  publicCode: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  tickets: {
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
  }[];
};

type Props = {
  initial: ClientDetail;
};

export function ClientDetailView({ initial }: Props) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {initial.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Visao consolidada: dados do cliente e tickets vinculados.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Key publica
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-primary">
            {initial.publicCode}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            E-mail
          </p>
          <p className="mt-1 text-sm text-foreground">{initial.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Telefone
          </p>
          <p className="mt-1 text-sm text-foreground">{initial.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Cadastro
          </p>
          <p className="mt-1 text-sm text-foreground">
            {new Date(initial.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">
          Tickets desta empresa
        </h2>
        <p className="mt-1 text-sm text-muted">
          Chamados vinculados a este cliente. Abra na central de tickets para ver
          detalhes e comentarios.
        </p>

        {initial.tickets.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum ticket ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Atualizado</th>
                  <th className="px-4 py-3 font-medium">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initial.tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-background/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.title}</p>
                      {t.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {t.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {priorityLabel[t.priority] ?? t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {statusLabel[t.status] ?? t.status}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(t.updatedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets?ticket=${t.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
