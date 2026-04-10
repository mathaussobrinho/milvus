import { useEffect, useState } from "react";
import "./App.css";

type Overview = {
  devices: number;
  onlineDevices: number;
  activeAlerts: number;
  openTickets: number;
};

const apiBase =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:5212";

function App() {
  const [data, setData] = useState<Overview | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/dashboard/overview`);
        if (!res.ok) {
          if (!cancelled)
            setError(`API respondeu ${res.status}. Verifique se a API esta em ${apiBase}`);
          setData(null);
          return;
        }
        const json = (await res.json()) as Overview;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(`Nao foi possivel conectar em ${apiBase}`);
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openTickets =
    data === undefined ? "..." : data === null ? "—" : String(data.openTickets);
  const alerts =
    data === undefined ? "..." : data === null ? "—" : String(data.activeAlerts);
  const online =
    data === undefined ? "..." : data === null ? "—" : String(data.onlineDevices);

  return (
    <main className="desktop-shell">
      <header>
        <p className="eyebrow">VisoHelp Desktop</p>
        <h1>Central de Operacoes</h1>
        {error ? <p className="api-error">{error}</p> : null}
        <p className="api-hint">
          API: <code>{apiBase}</code> ·{" "}
          <a href="http://127.0.0.1:3000/dashboard" target="_blank" rel="noreferrer">
            Abrir painel web
          </a>
        </p>
      </header>
      <section className="cards">
        <article className="card primary">
          <p>Tickets em aberto</p>
          <strong>{openTickets}</strong>
        </article>
        <article className="card danger">
          <p>Alertas ativos</p>
          <strong>{alerts}</strong>
        </article>
        <article className="card neutral">
          <p>Dispositivos online</p>
          <strong>{online}</strong>
        </article>
      </section>
    </main>
  );
}

export default App;
