import { fetchJson } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { AnalystsManager, type AnalystRow } from "./AnalystsManager";

export default async function AnalistasPage() {
  const rows = await fetchJson<AnalystRow[]>("/api/v1/analysts");
  const apiBase = getApiBase();

  if (!rows) {
    return (
      <div className="p-6">
        <p className="text-sm text-danger">
          Nao foi possivel carregar analistas. API em{" "}
          <code className="rounded bg-surface px-1">{apiBase}</code>
        </p>
      </div>
    );
  }

  return <AnalystsManager initial={rows} />;
}
