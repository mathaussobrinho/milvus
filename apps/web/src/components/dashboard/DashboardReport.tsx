"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { priorityLabel, statusLabel } from "@/components/tickets/ticketLabels";

export type TicketsAnalytics = {
  byStatus: { key: string; count: number }[];
  byPriority: { key: string; count: number }[];
  byClient: { key: string; count: number }[];
  byDay: { date: string; count: number }[];
};

/** Paleta suave (baixa saturacao) — leitura confortavel no tema claro */
const COLORS = [
  "#6b8fb8",
  "#9b7aad",
  "#6fa88a",
  "#c49a6c",
  "#7a7ab8",
  "#8a929e",
];

function labelStatus(k: string) {
  return statusLabel[k] ?? k;
}

function labelPriority(k: string) {
  return priorityLabel[k] ?? k;
}

const tooltipLight = {
  backgroundColor: "#ffffff",
  border: "1px solid #cdd5e4",
  borderRadius: 8,
  fontSize: 12,
  color: "#1e2430",
};

function DonutCard({
  title,
  data,
  nameFn,
}: {
  title: string;
  data: { key: string; count: number }[];
  nameFn: (k: string) => string;
}) {
  const chartData = data.map((d) => ({
    name: nameFn(d.key),
    value: d.count,
    rawKey: d.key,
  }));

  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-xl border border-border bg-background/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-2 flex flex-1 flex-col sm:flex-row sm:items-center">
        <div className="h-[200px] w-full sm:w-1/2">
          {chartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted">
              Sem dados
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      stroke="rgba(238,241,248,1)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipLight}
                  labelStyle={{ color: "#1e2430" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <ul className="mt-2 max-h-[180px] flex-1 space-y-1.5 overflow-y-auto text-xs sm:mt-0 sm:pl-2">
          {chartData.map((d, i) => (
            <li
              key={d.rawKey}
              className="flex items-center justify-between gap-2 text-foreground/90"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="shrink-0 font-mono text-muted">({d.value})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DashboardReport({ data }: { data: TicketsAnalytics }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Relatorio em tempo real
        </h2>
        <p className="mt-1 text-sm text-muted">
          Snapshot dos tickets no momento do carregamento (atualize a pagina para
          atualizar).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonutCard
          title="Total de tickets por status"
          data={data.byStatus}
          nameFn={labelStatus}
        />
        <DonutCard
          title="Tickets por prioridade"
          data={data.byPriority}
          nameFn={labelPriority}
        />
        <DonutCard
          title="Tickets por cliente"
          data={data.byClient}
          nameFn={(k) => k}
        />
        <div className="flex min-h-[260px] flex-col rounded-xl border border-border bg-background/60 p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Origem dos tickets
          </h3>
          <p className="mt-3 flex flex-1 items-center text-sm text-muted">
            Em breve: e-mail, portal e integracoes quando o modelo existir.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/60 p-4">
        <h3 className="text-sm font-semibold text-foreground">Tickets por dia</h3>
        <div className="mt-4 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,36,48,0.08)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(92,100,115,0.95)", fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(92,100,115,0.95)", fontSize: 10 }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipLight} labelStyle={{ color: "#1e2430" }} />
              <Bar
                dataKey="count"
                fill="#0048ff"
                fillOpacity={0.75}
                radius={[4, 4, 0, 0]}
                name="Criados"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
