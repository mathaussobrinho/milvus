/**
 * Dados do portal publico "Abrir chamado" (localStorage/sessionStorage).
 * Chamado apos desinstalar o agente (pagina /limpar-dados-portal ou ?purge=1).
 * Nao remove visohelp_token (analistas) nem visohelp:tickets:view.
 */
export function clearVisoHelpPortalAgentBrowserData(): void {
  if (typeof window === "undefined") return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("visohelp_public_")) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      if (k.startsWith("visohelp_public_")) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
