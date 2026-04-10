Coloque aqui o ficheiro VisoHelp.Agent.zip gerado na raiz do projeto com:

  powershell -File installer\publish-release.ps1

Copie release\VisoHelp.Agent.zip para esta pasta com o nome:

  VisoHelp.Agent.zip

O ZIP gerado por publish-release.ps1 inclui appsettings.Production.json junto do
exe e appsettings.json; e necessario para o agente usar a API em producao (HTTPS).

Assim o link "Baixar" em Configuracoes > Agente funciona apos o deploy.

Opcional: defina NEXT_PUBLIC_AGENT_DOWNLOAD_URL para apontar para um URL externo (CDN).

O ficheiro Desinstalar-VisoHelp-Agent.cmd deve permanecer nesta pasta para o
link "Baixar desinstalador" em Configuracoes > Agente. E gerado em
installer/Desinstalar-VisoHelp-Agent.cmd e incluido no VisoHelp.Agent.zip por
publish-release.ps1.

Opcional: NEXT_PUBLIC_AGENT_UNINSTALL_URL para um URL externo do desinstalador.
