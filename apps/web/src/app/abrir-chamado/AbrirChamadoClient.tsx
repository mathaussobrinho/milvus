"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api-base";
import { showToast } from "@/lib/toast";

type ClientInfo = { id: string; name: string; publicCode: string };

export function AbrirChamadoClient() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key")?.trim() ?? "";
  const agentKeyFromUrl = searchParams.get("agentKey")?.trim() ?? "";

  const [publicCode, setPublicCode] = useState(keyFromUrl.toUpperCase());
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterDepartment, setRequesterDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadClient = useCallback(async (code: string) => {
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setClientInfo(null);
      return;
    }
    setLoadingClient(true);
    try {
      const api = getApiBase();
      const res = await fetch(
        `${api}/api/v1/public/client-by-code?code=${encodeURIComponent(c)}`,
        { method: "GET", cache: "no-store" }
      );
      if (res.status === 404) {
        setClientInfo(null);
        setLoadingClient(false);
        return;
      }
      if (!res.ok) {
        setClientInfo(null);
        setLoadingClient(false);
        return;
      }
      const data = (await res.json()) as ClientInfo;
      setClientInfo(data);
    } catch {
      setClientInfo(null);
    } finally {
      setLoadingClient(false);
    }
  }, []);

  useEffect(() => {
    if (keyFromUrl) setPublicCode(keyFromUrl.toUpperCase());
  }, [keyFromUrl]);

  useEffect(() => {
    void loadClient(publicCode);
  }, [publicCode, loadClient]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = publicCode.trim().toUpperCase();
    if (!code || !title.trim()) {
      showToast({ title: "Preencha o titulo.", variant: "error" });
      return;
    }
    if (!requesterName.trim() || !requesterEmail.trim()) {
      showToast({
        title: "Preencha nome e e-mail do solicitante.",
        variant: "error",
      });
      return;
    }
    if (!requesterEmail.includes("@")) {
      showToast({ title: "E-mail invalido.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const api = getApiBase();
      const body: Record<string, unknown> = {
        publicCode: code,
        title: title.trim(),
        clientMessage: message.trim() || null,
        requesterName: requesterName.trim(),
        requesterEmail: requesterEmail.trim(),
        requesterPhone: requesterPhone.trim() || null,
        requesterDepartment: requesterDepartment.trim() || null,
      };
      if (agentKeyFromUrl) body.agentKey = agentKeyFromUrl;

      const res = await fetch(`${api}/api/v1/public/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          typeof json === "object" && json && "error" in json
            ? String((json as { error: string }).error)
            : "Nao foi possivel abrir o chamado.";
        showToast({ title: err, variant: "error" });
        return;
      }
      showToast({ title: "Chamado registrado com sucesso.", variant: "success" });
      setTitle("");
      setMessage("");
      setRequesterName("");
      setRequesterEmail("");
      setRequesterPhone("");
      setRequesterDepartment("");
    } catch {
      showToast({ title: "Falha de rede. Tente novamente.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!keyFromUrl) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-10">
        <h1 className="mb-1 text-xl font-semibold text-foreground">
          Abrir chamado
        </h1>
        <p className="mb-4 text-sm text-muted">
          Para identificar o cliente, abra esta pagina pelo atalho{" "}
          <strong>VisoHelp Abrir chamado</strong> no ambiente de trabalho (instalado
          com o agente) ou use um link que contenha o codigo na URL, por exemplo:{" "}
          <code className="rounded bg-surface px-1 text-xs">
            ?key=XXXXX
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-foreground">
        Abrir chamado
      </h1>
      <p className="mb-6 text-sm text-muted">
        Cliente identificado pelo ambiente. Preencha seus dados e o problema. Nao e
        necessario login.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        {loadingClient && (
          <p className="text-xs text-muted">Verificando cliente...</p>
        )}
        {!loadingClient && publicCode.trim().length >= 3 && !clientInfo && (
          <p className="text-sm text-danger">Codigo do cliente invalido ou API indisponivel.</p>
        )}
        {clientInfo && (
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <span className="text-xs uppercase text-muted">Cliente</span>
            <p className="font-medium text-primary">{clientInfo.name}</p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted">
            Nome completo
          </label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            required
            maxLength={200}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted">
            E-mail
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            required
            maxLength={200}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted">
            Telefone
          </label>
          <input
            type="tel"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value)}
            maxLength={50}
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted">
            Departamento
          </label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            value={requesterDepartment}
            onChange={(e) => setRequesterDepartment(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted">
            Titulo
          </label>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Resumo do problema"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted">
            Mensagem (opcional)
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
            placeholder="Detalhes, horario, equipamento..."
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !clientInfo}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Enviar chamado"}
        </button>
      </form>
    </div>
  );
}
