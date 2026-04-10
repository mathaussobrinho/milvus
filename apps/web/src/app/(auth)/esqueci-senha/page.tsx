"use client";

import Link from "next/link";
import { useState } from "react";
import { getApiBase } from "@/lib/api-base";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setDevToken(null);
    setBusy(true);
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        message?: string;
        devResetToken?: string;
      };
      setMessage(data.message ?? "Se o e-mail existir, siga as instrucoes enviadas.");
      if (data.devResetToken) setDevToken(data.devResetToken);
    } catch {
      setMessage("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl">
      <h1 className="text-xl font-semibold text-foreground">Esqueci a senha</h1>
      <p className="mt-1 text-sm text-muted">
        Informe seu e-mail cadastrado. Em producao, enviaremos o link de
        redefinicao. Em desenvolvimento, a API pode retornar um token de teste
        abaixo.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-xs font-medium text-foreground/80" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary focus:border-primary focus:ring-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Enviando..." : "Continuar"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 text-sm text-foreground/90" role="status">
          {message}
        </p>
      ) : null}
      {devToken ? (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900">
          <p className="font-semibold">Ambiente de desenvolvimento</p>
          <p className="mt-1 break-all">Token: {devToken}</p>
          <p className="mt-2">
            Use na pagina{" "}
            <Link href="/redefinir-senha" className="text-primary underline">
              Redefinir senha
            </Link>
            .
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
