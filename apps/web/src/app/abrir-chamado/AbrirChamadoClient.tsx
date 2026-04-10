"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api-base";
import { showToast } from "@/lib/toast";

type ClientInfo = { id: string; name: string; publicCode: string };

type PublicMyTicketItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type PublicTicketComment = {
  id: string;
  body: string;
  isFromClient: boolean;
  authorName: string;
  createdAt: string;
};

type PublicTicketDetail = {
  id: string;
  title: string;
  clientProvidedDescription: string | null;
  status: string;
  priority: string;
  requesterName: string | null;
  createdAt: string;
  updatedAt: string;
  comments: PublicTicketComment[];
};

function storageEmailKey(publicCode: string) {
  return `visohelp_public_email_${publicCode.trim().toUpperCase()}`;
}

export function AbrirChamadoClient() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key")?.trim() ?? "";
  const agentKeyFromUrl = searchParams.get("agentKey")?.trim() ?? "";
  const tabFromUrl = searchParams.get("tab")?.toLowerCase();

  const [tab, setTab] = useState<"novo" | "meus">(
    tabFromUrl === "meus" ? "meus" : "novo"
  );

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

  const [trackerEmail, setTrackerEmail] = useState("");
  const [myTickets, setMyTickets] = useState<PublicMyTicketItem[] | null>(null);
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);

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

  useEffect(() => {
    if (tabFromUrl === "meus") setTab("meus");
    if (tabFromUrl === "novo") setTab("novo");
  }, [tabFromUrl]);

  useEffect(() => {
    const code = publicCode.trim().toUpperCase();
    if (code.length < 3) return;
    try {
      const saved = sessionStorage.getItem(storageEmailKey(code));
      if (saved) setTrackerEmail(saved);
    } catch {
      /* ignore */
    }
  }, [publicCode]);

  const fetchMyTickets = useCallback(async () => {
    const code = publicCode.trim().toUpperCase();
    const email = trackerEmail.trim();
    if (!code || !email || !email.includes("@")) {
      showToast({ title: "Informe um e-mail valido.", variant: "error" });
      return;
    }
    setMyTicketsLoading(true);
    setMyTickets(null);
    try {
      const api = getApiBase();
      const res = await fetch(
        `${api}/api/v1/public/my-tickets?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`,
        { method: "GET", cache: "no-store" }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          typeof json === "object" && json && "error" in json
            ? String((json as { error: string }).error)
            : "Nao foi possivel carregar os chamados.";
        showToast({ title: err, variant: "error" });
        return;
      }
      setMyTickets(json as PublicMyTicketItem[]);
      try {
        sessionStorage.setItem(storageEmailKey(code), email);
      } catch {
        /* ignore */
      }
    } catch {
      showToast({ title: "Falha de rede. Tente novamente.", variant: "error" });
    } finally {
      setMyTicketsLoading(false);
    }
  }, [publicCode, trackerEmail]);

  const fetchDetail = useCallback(
    async (ticketId: string) => {
      const code = publicCode.trim().toUpperCase();
      const email = trackerEmail.trim();
      if (!code || !email) return;
      setDetailLoading(true);
      setDetail(null);
      try {
        const api = getApiBase();
        const res = await fetch(
          `${api}/api/v1/public/tickets/${ticketId}?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`,
          { method: "GET", cache: "no-store" }
        );
        if (res.status === 404) {
          showToast({ title: "Chamado nao encontrado.", variant: "error" });
          setSelectedTicketId(null);
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err =
            typeof json === "object" && json && "error" in json
              ? String((json as { error: string }).error)
              : "Nao foi possivel carregar o chamado.";
          showToast({ title: err, variant: "error" });
          return;
        }
        setDetail(json as PublicTicketDetail);
      } catch {
        showToast({ title: "Falha de rede. Tente novamente.", variant: "error" });
      } finally {
        setDetailLoading(false);
      }
    },
    [publicCode, trackerEmail]
  );

  useEffect(() => {
    if (!selectedTicketId) {
      setDetail(null);
      setReplyBody("");
      return;
    }
    void fetchDetail(selectedTicketId);
  }, [selectedTicketId, fetchDetail]);

  const refreshMyTicketsSilent = useCallback(async () => {
    const code = publicCode.trim().toUpperCase();
    const email = trackerEmail.trim();
    if (!code || !email || !email.includes("@")) return;
    try {
      const api = getApiBase();
      const res = await fetch(
        `${api}/api/v1/public/my-tickets?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) return;
      const json = (await res.json()) as PublicMyTicketItem[];
      setMyTickets(json);
    } catch {
      /* ignore */
    }
  }, [publicCode, trackerEmail]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicketId || !detail) return;
    const text = replyBody.trim();
    if (!text) {
      showToast({ title: "Escreva uma mensagem.", variant: "error" });
      return;
    }
    const code = publicCode.trim().toUpperCase();
    const email = trackerEmail.trim();
    setReplySending(true);
    try {
      const api = getApiBase();
      const res = await fetch(
        `${api}/api/v1/public/tickets/${selectedTicketId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicCode: code,
            requesterEmail: email,
            body: text,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          typeof json === "object" && json && "error" in json
            ? String((json as { error: string }).error)
            : "Nao foi possivel enviar a resposta.";
        showToast({ title: err, variant: "error" });
        return;
      }
      setReplyBody("");
      showToast({ title: "Mensagem enviada.", variant: "success" });
      await fetchDetail(selectedTicketId);
      void refreshMyTicketsSilent();
    } catch {
      showToast({ title: "Falha de rede. Tente novamente.", variant: "error" });
    } finally {
      setReplySending(false);
    }
  }

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
      try {
        sessionStorage.setItem(storageEmailKey(code), requesterEmail.trim());
      } catch {
        /* ignore */
      }
      setTrackerEmail(requesterEmail.trim());
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
      <p className="mb-4 text-sm text-muted">
        Cliente identificado pelo ambiente. Preencha seus dados e o problema. Nao e
        necessario login.
      </p>

      <div className="mb-6 flex gap-2 rounded-lg border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab("novo")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "novo"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:bg-surface-hover"
          }`}
        >
          Novo chamado
        </button>
        <button
          type="button"
          onClick={() => setTab("meus")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            tab === "meus"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:bg-surface-hover"
          }`}
        >
          Meus chamados
        </button>
      </div>

      {tab === "novo" && (
        <form onSubmit={onSubmit} className="space-y-4">
          {loadingClient && (
            <p className="text-xs text-muted">Verificando cliente...</p>
          )}
          {!loadingClient && publicCode.trim().length >= 3 && !clientInfo && (
            <p className="text-sm text-danger">
              Codigo do cliente invalido ou API indisponivel.
            </p>
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
      )}

      {tab === "meus" && (
        <div className="space-y-4">
          {clientInfo && (
            <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <span className="text-xs uppercase text-muted">Cliente</span>
              <p className="font-medium text-primary">{clientInfo.name}</p>
            </div>
          )}
          {!selectedTicketId && (
            <>
              <p className="text-sm text-muted">
                Use o mesmo e-mail informado ao abrir chamados para listar e
                acompanhar.
              </p>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-muted">
                  E-mail
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
                  value={trackerEmail}
                  onChange={(e) => setTrackerEmail(e.target.value)}
                  maxLength={200}
                  autoComplete="email"
                />
              </div>
              <button
                type="button"
                onClick={() => void fetchMyTickets()}
                disabled={myTicketsLoading || !clientInfo}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {myTicketsLoading ? "Carregando..." : "Ver meus chamados"}
              </button>
              {loadingClient && (
                <p className="text-xs text-muted">Verificando cliente...</p>
              )}
              {!loadingClient && publicCode.trim().length >= 3 && !clientInfo && (
                <p className="text-sm text-danger">
                  Codigo do cliente invalido ou API indisponivel.
                </p>
              )}
              {myTickets && myTickets.length === 0 && (
                <p className="text-sm text-muted">
                  Nenhum chamado encontrado para este e-mail.
                </p>
              )}
              {myTickets && myTickets.length > 0 && (
                <ul className="space-y-2">
                  {myTickets.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTicketId(t.id)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-left text-sm transition hover:border-primary"
                      >
                        <div className="font-medium text-foreground">
                          {t.title}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                          <span>{t.status}</span>
                          <span>
                            {new Date(t.updatedAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {selectedTicketId && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Voltar para a lista
              </button>
              {detailLoading && (
                <p className="text-sm text-muted">Carregando chamado...</p>
              )}
              {detail && !detailLoading && (
                <>
                  <div className="rounded-lg border border-border bg-surface px-3 py-3 text-sm">
                    <h2 className="text-base font-semibold text-foreground">
                      {detail.title}
                    </h2>
                    <p className="mt-2 text-xs text-muted">
                      {detail.status} · {detail.priority}
                    </p>
                    {detail.clientProvidedDescription && (
                      <p className="mt-3 whitespace-pre-wrap text-foreground">
                        {detail.clientProvidedDescription}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase text-muted">
                      Historico
                    </h3>
                    <ul className="max-h-[320px] space-y-3 overflow-y-auto rounded-lg border border-border bg-surface p-3">
                      {detail.comments.length === 0 && (
                        <li className="text-sm text-muted">
                          Ainda nao ha mensagens.
                        </li>
                      )}
                      {detail.comments.map((c) => (
                        <li
                          key={c.id}
                          className={`rounded-md px-2 py-2 text-sm ${
                            c.isFromClient
                              ? "bg-primary/10 text-foreground"
                              : "bg-muted/30 text-foreground"
                          }`}
                        >
                          <div className="text-xs text-muted">
                            {c.authorName} ·{" "}
                            {new Date(c.createdAt).toLocaleString("pt-BR")}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <form onSubmit={sendReply} className="space-y-2">
                    <label className="block text-xs font-medium uppercase text-muted">
                      Sua resposta
                    </label>
                    <textarea
                      className="min-h-[100px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      maxLength={4000}
                      placeholder="Escreva uma mensagem para o suporte..."
                    />
                    <button
                      type="submit"
                      disabled={replySending}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {replySending ? "Enviando..." : "Enviar mensagem"}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
