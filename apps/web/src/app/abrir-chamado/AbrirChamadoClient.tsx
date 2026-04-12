"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  isTerminalStatus,
  priorityLabel,
  shortTicketId,
  statusLabel,
} from "@/components/tickets/ticketLabels";
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

function storageProfileKey(publicCode: string) {
  return `visohelp_public_profile_${publicCode.trim().toUpperCase()}`;
}

function storageAgentKey(publicCode: string) {
  return `visohelp_public_agent_${publicCode.trim().toUpperCase()}`;
}

function storageFirstTicketKey(publicCode: string) {
  return `visohelp_public_first_ticket_${publicCode.trim().toUpperCase()}`;
}

function clearPortalStorageForCode(publicCode: string) {
  try {
    localStorage.removeItem(storageProfileKey(publicCode));
    localStorage.removeItem(storageFirstTicketKey(publicCode));
    sessionStorage.removeItem(storageEmailKey(publicCode));
  } catch {
    /* ignore */
  }
}

type SavedRequesterProfile = {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
};

function parseStoredProfile(raw: string | null): SavedRequesterProfile | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<SavedRequesterProfile>;
    const email = typeof j.email === "string" ? j.email.trim() : "";
    const name = typeof j.name === "string" ? j.name.trim() : "";
    if (!name || !email || !email.includes("@")) return null;
    return {
      name,
      email,
      phone: typeof j.phone === "string" ? j.phone.trim() : "",
      department: typeof j.department === "string" ? j.department.trim() : "",
      role: typeof j.role === "string" ? j.role.trim() : "",
    };
  } catch {
    return null;
  }
}

/** Flag explicita; migracao legacy: sem flag + sem agentKey na URL + perfil guardado => ja abriu chamado antes. */
function getFirstTicketDoneFromStorage(
  code: string,
  agentKeyInUrl: string
): boolean {
  try {
    const raw = localStorage.getItem(storageFirstTicketKey(code));
    if (raw === "1") return true;
    if (raw === "0") return false;
    if (agentKeyInUrl.trim().length > 0) return false;
    return (
      parseStoredProfile(localStorage.getItem(storageProfileKey(code))) !== null
    );
  } catch {
    return false;
  }
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
  const [requesterRole, setRequesterRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedProfile, setSavedProfile] = useState<SavedRequesterProfile | null>(
    null
  );
  const [firstTicketDone, setFirstTicketDone] = useState(false);

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

  /** Troca de agentKey (reinstalacao): limpa perfil e flags neste codigo. */
  useEffect(() => {
    const code = publicCode.trim().toUpperCase();
    if (code.length < 3) return;
    const k = agentKeyFromUrl.trim();
    if (!k) return;
    try {
      const prev = localStorage.getItem(storageAgentKey(code));
      if (prev && prev !== k) {
        clearPortalStorageForCode(code);
        setSavedProfile(null);
        setFirstTicketDone(false);
        setRequesterName("");
        setRequesterEmail("");
        setRequesterPhone("");
        setRequesterDepartment("");
        setRequesterRole("");
        setTrackerEmail("");
        setTitle("");
        setMessage("");
      }
      localStorage.setItem(storageAgentKey(code), k);
    } catch {
      /* ignore */
    }
  }, [publicCode, agentKeyFromUrl]);

  useEffect(() => {
    const code = publicCode.trim().toUpperCase();
    if (code.length < 3) return;
    const k = agentKeyFromUrl.trim();
    let profile: SavedRequesterProfile | null = null;
    try {
      profile = parseStoredProfile(localStorage.getItem(storageProfileKey(code)));
    } catch {
      /* ignore */
    }
    setFirstTicketDone(getFirstTicketDoneFromStorage(code, k));
    if (profile) {
      setSavedProfile(profile);
      setRequesterName(profile.name);
      setRequesterEmail(profile.email);
      setRequesterPhone(profile.phone);
      setRequesterDepartment(profile.department);
      setRequesterRole(profile.role);
      setTrackerEmail(profile.email);
      try {
        sessionStorage.setItem(storageEmailKey(code), profile.email);
      } catch {
        /* ignore */
      }
      return;
    }
    setSavedProfile(null);
    try {
      const emailOnly = sessionStorage.getItem(storageEmailKey(code));
      if (emailOnly) setTrackerEmail(emailOnly);
    } catch {
      /* ignore */
    }
  }, [publicCode, agentKeyFromUrl]);

  /** Preenche campos a partir da API; nao grava perfil nem ativa modo compacto ate o primeiro POST. */
  useEffect(() => {
    const code = publicCode.trim().toUpperCase();
    const k = agentKeyFromUrl.trim();
    if (code.length < 3 || !k || !clientInfo) return;
    if (getFirstTicketDoneFromStorage(code, k)) return;
    let cancelled = false;
    void (async () => {
      try {
        const api = getApiBase();
        const res = await fetch(
          `${api}/api/v1/public/requester-profile?code=${encodeURIComponent(code)}&agentKey=${encodeURIComponent(k)}`,
          { method: "GET", cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          name: string;
          email: string;
          phone: string | null;
          department: string | null;
          role: string | null;
        };
        const prof: SavedRequesterProfile = {
          name: json.name,
          email: json.email,
          phone: json.phone ?? "",
          department: json.department ?? "",
          role: json.role ?? "",
        };
        if (cancelled) return;
        setRequesterName(prof.name);
        setRequesterEmail(prof.email);
        setRequesterPhone(prof.phone);
        setRequesterDepartment(prof.department);
        setRequesterRole(prof.role);
        setTrackerEmail(prof.email);
        try {
          sessionStorage.setItem(storageEmailKey(code), prof.email);
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicCode, agentKeyFromUrl, clientInfo]);

  const agentKey = agentKeyFromUrl.trim();
  const compactMode = savedProfile !== null && firstTicketDone;

  const fetchMyTickets = useCallback(async () => {
    const code = publicCode.trim().toUpperCase();
    const email = trackerEmail.trim();
    if (!code) return;
    if (!agentKey && (!email || !email.includes("@"))) {
      showToast({
        title:
          "Abra pelo atalho VisoHelp neste PC ou informe o e-mail do solicitante (aba Novo chamado).",
        variant: "error",
      });
      return;
    }
    setMyTicketsLoading(true);
    setMyTickets(null);
    try {
      const api = getApiBase();
      const params = new URLSearchParams({ code });
      if (agentKey) params.set("agentKey", agentKey);
      if (email) params.set("email", email);
      const res = await fetch(
        `${api}/api/v1/public/my-tickets?${params.toString()}`,
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
        if (email) sessionStorage.setItem(storageEmailKey(code), email);
      } catch {
        /* ignore */
      }
    } catch {
      showToast({ title: "Falha de rede. Tente novamente.", variant: "error" });
    } finally {
      setMyTicketsLoading(false);
    }
  }, [publicCode, agentKey, trackerEmail]);

  const fetchDetail = useCallback(
    async (ticketId: string) => {
      const code = publicCode.trim().toUpperCase();
      const email = trackerEmail.trim();
      if (!code) return;
      if (!agentKey && (!email || !email.includes("@"))) return;
      setDetailLoading(true);
      setDetail(null);
      try {
        const api = getApiBase();
        const params = new URLSearchParams({ code });
        if (agentKey) params.set("agentKey", agentKey);
        if (email) params.set("email", email);
        const res = await fetch(
          `${api}/api/v1/public/tickets/${ticketId}?${params.toString()}`,
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
    [publicCode, agentKey, trackerEmail]
  );

  useEffect(() => {
    if (!selectedTicketId) {
      setDetail(null);
      setReplyBody("");
      return;
    }
    void fetchDetail(selectedTicketId);
  }, [selectedTicketId, fetchDetail]);

  useEffect(() => {
    if (tab !== "meus" || !clientInfo || selectedTicketId) return;
    if (!agentKey && (!trackerEmail.trim() || !trackerEmail.includes("@")))
      return;
    void fetchMyTickets();
  }, [tab, agentKey, clientInfo, selectedTicketId, trackerEmail, fetchMyTickets]);

  const refreshMyTicketsSilent = useCallback(async () => {
    const code = publicCode.trim().toUpperCase();
    const email = trackerEmail.trim();
    if (!code) return;
    if (!agentKey && (!email || !email.includes("@"))) return;
    try {
      const api = getApiBase();
      const params = new URLSearchParams({ code });
      if (agentKey) params.set("agentKey", agentKey);
      if (email) params.set("email", email);
      const res = await fetch(
        `${api}/api/v1/public/my-tickets?${params.toString()}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) return;
      const json = (await res.json()) as PublicMyTicketItem[];
      setMyTickets(json);
    } catch {
      /* ignore */
    }
  }, [publicCode, agentKey, trackerEmail]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicketId || !detail) return;
    if (isTerminalStatus(detail.status)) return;
    const text = replyBody.trim();
    if (!text) {
      showToast({ title: "Escreva uma mensagem.", variant: "error" });
      return;
    }
    const code = publicCode.trim().toUpperCase();
    const email = trackerEmail.trim();
    if (!agentKey && (!email || !email.includes("@"))) {
      showToast({
        title:
          "Use o atalho VisoHelp neste PC ou abra a aba Novo chamado para identificar o solicitante.",
        variant: "error",
      });
      return;
    }
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
            body: text,
            agentKey: agentKey || null,
            requesterEmail: email || null,
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

  function persistProfile(code: string, p: SavedRequesterProfile) {
    try {
      localStorage.setItem(storageProfileKey(code), JSON.stringify(p));
      localStorage.setItem(storageFirstTicketKey(code), "1");
    } catch {
      /* ignore */
    }
    setSavedProfile(p);
    setFirstTicketDone(true);
    setRequesterName(p.name);
    setRequesterEmail(p.email);
    setRequesterPhone(p.phone);
    setRequesterDepartment(p.department);
    setRequesterRole(p.role);
    setTrackerEmail(p.email);
    try {
      sessionStorage.setItem(storageEmailKey(code), p.email);
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = publicCode.trim().toUpperCase();
    if (!code || !title.trim()) {
      showToast({ title: "Preencha o titulo.", variant: "error" });
      return;
    }
    const useCompact = compactMode;
    const prof: SavedRequesterProfile = useCompact
      ? savedProfile!
      : {
          name: requesterName.trim(),
          email: requesterEmail.trim(),
          phone: requesterPhone.trim(),
          department: requesterDepartment.trim(),
          role: requesterRole.trim(),
        };
    if (!useCompact) {
      if (!prof.name || !prof.email) {
        showToast({
          title: "Preencha nome e e-mail do solicitante.",
          variant: "error",
        });
        return;
      }
      if (!prof.email.includes("@")) {
        showToast({ title: "E-mail invalido.", variant: "error" });
        return;
      }
    }
    if (!message.trim()) {
      showToast({
        title: "Preencha a mensagem com o relato do problema.",
        variant: "error",
      });
      return;
    }
    setSubmitting(true);
    try {
      const api = getApiBase();
      const body: Record<string, unknown> = {
        publicCode: code,
        title: title.trim(),
        clientMessage: message.trim(),
        requesterName: prof.name,
        requesterEmail: prof.email,
        requesterPhone: prof.phone || null,
        requesterDepartment: prof.department || null,
        requesterRole: prof.role || null,
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
      persistProfile(code, prof);
      setTab("meus");
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
        Cliente identificado pelo ambiente.{" "}
        {compactMode
          ? agentKey
            ? "Seus dados estao registrados; basta titulo e mensagem para novos chamados."
            : "Seus dados estao neste navegador; basta titulo e mensagem para novos chamados."
          : "Preencha seus dados e o problema. Nao e necessario login."}
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
          {!compactMode && (
            <>
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
                  Setor
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
                  Cargo
                </label>
                <input
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
                  value={requesterRole}
                  onChange={(e) => setRequesterRole(e.target.value)}
                  maxLength={120}
                  placeholder="Opcional"
                />
              </div>
            </>
          )}
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
              Mensagem
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
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
          <p className="text-sm text-muted">
            {agentKey ? (
              <>
                Chamados abertos neste computador (atalho VisoHelp). Use{" "}
                <strong>Atualizar lista</strong> para recarregar.
              </>
            ) : savedProfile || trackerEmail.trim().includes("@") ? (
              <>
                Chamados associados ao seu e-mail neste navegador (o mesmo do
                primeiro registro).
              </>
            ) : (
              <>
                Abra um chamado em <strong>Novo chamado</strong> para registrar seus dados
                neste navegador, ou use o atalho <strong>VisoHelp</strong> neste PC. Depois
                disso, a lista aqui usa sempre o mesmo e-mail.
              </>
            )}
          </p>
          {!selectedTicketId && (
            <>
              {loadingClient && (
                <p className="text-xs text-muted">Verificando cliente...</p>
              )}
              {!loadingClient && publicCode.trim().length >= 3 && !clientInfo && (
                <p className="text-sm text-danger">
                  Codigo do cliente invalido ou API indisponivel.
                </p>
              )}
              {clientInfo &&
                (agentKey ||
                  savedProfile ||
                  trackerEmail.trim().includes("@")) && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => void fetchMyTickets()}
                      disabled={
                        myTicketsLoading ||
                        (!agentKey &&
                          (!trackerEmail.trim() || !trackerEmail.includes("@")))
                      }
                      className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {myTicketsLoading ? "Atualizando..." : "Atualizar lista"}
                    </button>
                  </div>
                )}
              {myTickets && myTickets.length === 0 && !myTicketsLoading && (
                <p className="text-sm text-muted">
                  Nenhum chamado desta maquina ainda.
                </p>
              )}
              {myTickets && myTickets.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                  <table className="w-full min-w-[320px] text-left text-sm">
                    <thead className="border-b border-border bg-background text-xs uppercase text-muted">
                      <tr>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Nº chamado
                        </th>
                        <th className="min-w-[140px] px-3 py-2 font-medium">
                          Assunto
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myTickets.map((t) => (
                        <tr
                          key={t.id}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer hover:bg-background/80"
                          onClick={() => setSelectedTicketId(t.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedTicketId(t.id);
                            }
                          }}
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted">
                            #{shortTicketId(t.id)}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            {t.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-foreground">
                            {statusLabel[t.status] ?? t.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {selectedTicketId && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voltar para a lista
                </button>
                <button
                  type="button"
                  onClick={() => void fetchDetail(selectedTicketId)}
                  disabled={detailLoading}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {detailLoading ? "Atualizando..." : "Atualizar"}
                </button>
              </div>
              {detailLoading && (
                <p className="text-sm text-muted">Carregando chamado...</p>
              )}
              {detail && !detailLoading && (
                <>
                  <div className="rounded-lg border border-border bg-surface px-3 py-3 text-sm">
                    <p className="font-mono text-xs text-muted">
                      Chamado #{shortTicketId(detail.id)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-foreground">
                      {detail.title}
                    </h2>
                    <p className="mt-2 text-xs text-muted">
                      {statusLabel[detail.status] ?? detail.status} ·{" "}
                      {priorityLabel[detail.priority] ?? detail.priority}
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
                          className={`rounded-md border px-2 py-2 text-sm ${
                            c.isFromClient
                              ? "border-primary/25 bg-primary/10 text-foreground"
                              : "border-border bg-background text-foreground"
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
                  {isTerminalStatus(detail.status) ? (
                    <p className="rounded-lg border border-border bg-background/80 px-3 py-3 text-sm text-muted">
                      Este chamado esta encerrado (resolvido ou fechado) e nao aceita mais
                      mensagens nem pode ser reaberto por aqui.
                    </p>
                  ) : (
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
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
