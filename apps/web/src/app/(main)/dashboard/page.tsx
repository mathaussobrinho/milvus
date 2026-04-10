import { AppHeader } from "@/components/shell/AppHeader";
import {
  DashboardReport,
  type TicketsAnalytics,
} from "@/components/dashboard/DashboardReport";
import { fetchJson, getApiBase } from "@/lib/api";
import Link from "next/link";

type Overview = {
  devices: number;
  onlineDevices: number;
  activeAlerts: number;
  openTickets: number;
};

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "primary" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "primary"
      ? "border-primary/40 bg-primary/10 text-primary"
      : tone === "danger"
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-border bg-background text-foreground";

  return (
    <article className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-sm">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

export default async function DashboardPage() {
  const [data, analytics] = await Promise.all([
    fetchJson<Overview>("/api/v1/dashboard/overview"),
    fetchJson<TicketsAnalytics>("/api/v1/dashboard/tickets-analytics"),
  ]);
  const apiBase = getApiBase();

  return (
    <>
      <AppHeader
        title="Painel inicial"
        subtitle="Visao operacional de tickets, inventario e alertas."
        action={
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
            Ambiente local
          </span>
        }
      />
      <div className="flex-1 space-y-6 p-6">
        {!data ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            API indisponivel. Inicie o backend:{" "}
            <code className="rounded bg-surface px-1">{apiBase}</code>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Tickets abertos"
            value={data ? String(data.openTickets) : "—"}
            tone="primary"
          />
          <MetricCard
            title="Dispositivos online"
            value={data ? String(data.onlineDevices) : "—"}
            tone="neutral"
          />
          <MetricCard
            title="Alertas ativos"
            value={data ? String(data.activeAlerts) : "—"}
            tone="danger"
          />
          <MetricCard
            title="Total de dispositivos"
            value={data ? String(data.devices) : "—"}
            tone="neutral"
          />
        </div>

        {analytics ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <DashboardReport data={analytics} />
          </div>
        ) : data ? (
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            Relatorio indisponivel. Verifique a API em{" "}
            <code className="rounded bg-background px-1">{apiBase}</code>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Atalhos</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="text-primary hover:underline" href="/tickets">
                  Ver fila de tickets
                </Link>
              </li>
              <li>
                <Link
                  className="text-primary hover:underline"
                  href="/inventario"
                >
                  Inventario de dispositivos
                </Link>
              </li>
              <li>
                <a
                  className="text-primary hover:underline"
                  href={`${apiBase}/swagger`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentacao Swagger
                </a>
              </li>
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Proximas entregas</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-foreground/85">
              <li>Autenticacao e perfis (admin, tecnico, cliente)</li>
              <li>SLA, categorias e comentarios em tickets</li>
              <li>Alertas automaticos por metricas do agente</li>
              <li>Relatorios e exportacao</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
