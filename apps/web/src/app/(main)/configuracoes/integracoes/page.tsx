import { getApiBase } from "@/lib/api";

export default function IntegracoesPage() {
  const api = getApiBase();

  return (
    <div className="space-y-4 p-6 text-sm text-muted">
      <p>
        URL da API configurada em{" "}
        <code className="rounded bg-surface px-1 text-foreground">{api}</code>
      </p>
      <p>
        Proximos passos: login, multi-tenant, webhooks, e-mail e politicas de
        SLA.
      </p>
    </div>
  );
}
