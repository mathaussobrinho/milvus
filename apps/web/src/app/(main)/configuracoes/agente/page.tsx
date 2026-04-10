import { AppHeader } from "@/components/shell/AppHeader";

function getDownloadHref(): string {
  const override = process.env.NEXT_PUBLIC_AGENT_DOWNLOAD_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return "/downloads/VisoHelp.Agent.zip";
}

function getUninstallHref(): string {
  const override = process.env.NEXT_PUBLIC_AGENT_UNINSTALL_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return "/downloads/Desinstalar-VisoHelp-Agent.cmd";
}

export default function AgentePage() {
  const href = getDownloadHref();
  const fileName = "VisoHelp.Agent.zip";
  const uninstallHref = getUninstallHref();
  const uninstallFileName = "Desinstalar-VisoHelp-Agent.cmd";

  return (
    <>
      <AppHeader
        title="Agente Windows"
        subtitle="Instale o agente nas maquinas dos clientes para inventario e atalho para abrir chamado."
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Pacote do agente
              </h2>
              <p className="mt-2 text-sm text-muted">
                O pacote contem o executavel VisoHelp Agent (Windows x64, inclui
                runtime). Na primeira execucao o assistente pede apenas a{" "}
                <strong className="text-foreground">KEY</strong> do cliente (a
                mesma exibida na lista de clientes).
              </p>
              <ul className="mt-3 list-inside list-disc text-sm text-muted">
                <li>Sincroniza inventario (RAM, disco, antivirus) com a API.</li>
                <li>icone na bandeja: abrir chamado, sincronizar, sair.</li>
                <li>Atalho na area de trabalho para abrir chamado com a KEY.</li>
              </ul>
            </div>
            <a
              href={href}
              download={href.startsWith("/") ? fileName : undefined}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Baixar {fileName}
            </a>
          </div>
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted">
            Se o download nao estiver disponivel, copie o ficheiro gerado por{" "}
            <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
              installer/publish-release.ps1
            </code>{" "}
            para{" "}
            <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
              apps/web/public/downloads/VisoHelp.Agent.zip
            </code>{" "}
            antes do build de producao.
          </p>
        </div>

        <div className="max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Desinstalar o agente
              </h2>
              <p className="mt-2 text-sm text-muted">
                Script para Windows que encerra o VisoHelp Agent (se estiver a
                correr), remove o arranque automatico, o atalho na area de
                trabalho e a pasta do programa em{" "}
                <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
                  %LocalAppData%\VisoHelp
                </code>
                . Pode sair pelo menu da bandeja antes de executar, ou deixar o
                script terminar o processo.
              </p>
              <p className="mt-2 text-sm text-muted">
                Execute o ficheiro descarregado com duplo clique no PC do
                cliente; nao e necessario ser administrador para esta remocao.
              </p>
            </div>
            <a
              href={uninstallHref}
              download={
                uninstallHref.startsWith("/") ? uninstallFileName : undefined
              }
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/50"
            >
              Baixar {uninstallFileName}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
