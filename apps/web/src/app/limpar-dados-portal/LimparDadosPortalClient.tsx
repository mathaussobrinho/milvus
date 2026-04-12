"use client";

import { useEffect, useState } from "react";
import { clearVisoHelpPortalAgentBrowserData } from "@/lib/visohelp-portal-storage";

export function LimparDadosPortalClient() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    clearVisoHelpPortalAgentBrowserData();
    setDone(true);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        Dados locais do portal removidos
      </h1>
      <p className="mt-3 text-sm text-muted">
        Os dados do <strong>VisoHelp Abrir chamado</strong> (perfil, codigo do
        agente neste navegador, e-mail de acompanhamento) foram apagados deste
        site. Na proxima vez que abrir o chamado, sera preciso preencher nome,
        cargo, setor, e-mail e telefone de novo.
      </p>
      <p className="mt-4 text-xs text-muted">
        {done
          ? "Pode fechar esta janela."
          : "A limpar dados do navegador neste site..."}
      </p>
    </div>
  );
}
