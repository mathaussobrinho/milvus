# VisoHelp

VisoHelp e uma plataforma de Service Desk e Inventario de TI com foco em:
- gestao de tickets e SLA;
- inventario automatico de dispositivos;
- monitoramento operacional com alertas;
- experiencia multiplataforma (web, desktop, mobile e agente Windows).

## Stack inicial
- Backend: ASP.NET Core (`apps/backend`)
- Agente Windows: .NET Worker (`apps/agent`)
- Web: Next.js + TypeScript (`apps/web`)
- Desktop: React + Vite (`apps/desktop`)
- Mobile: React Native + Expo (`apps/mobile`)
- Banco alvo de producao: PostgreSQL

## Estrategia de ambiente
- Desenvolvimento local-first (tudo local para teste rapido)
- Producao na VPS com PostgreSQL

## Como executar localmente

Abra **dois terminais**. Em ambos, entre primeiro na pasta do repositorio (exemplo no Windows):

```powershell
cd "C:\Users\Mathaus Sobrinho\Documents\Mathaus\Projetos\Projeto Milvus"
```

Nao use `...` no caminho — isso era so exemplo na documentacao.

**Terminal 1 — API (porta 5212):**

```powershell
dotnet run --project apps\backend\VisoHelp.Api.csproj --launch-profile http
```

**Terminal 2 — Web (porta 3000):**

```powershell
cd apps\web
npm run dev
```

Se aparecer `address already in use` na porta **5212**, a API **ja esta rodando** em outro terminal ou processo. Opcoes:

- Manter a instancia que ja esta ativa e **nao** subir outra; teste `http://127.0.0.1:5212/api/health`
- Ou encerrar e subir de novo:

```powershell
taskkill /IM VisoHelp.Api.exe /F
```

Para ver o que usa a porta 5212:

```powershell
netstat -ano | findstr :5212
```

URLs tipicas com os servicos ligados:

- **Web (painel):** [http://127.0.0.1:3000/dashboard](http://127.0.0.1:3000/dashboard) (raiz `/` redireciona para `/dashboard`)
- **Tickets:** [http://127.0.0.1:3000/tickets](http://127.0.0.1:3000/tickets)
- **Inventario:** [http://127.0.0.1:3000/inventario](http://127.0.0.1:3000/inventario)
- **API + Swagger:** [http://127.0.0.1:5212/swagger](http://127.0.0.1:5212/swagger)
- **Health:** [http://127.0.0.1:5212/api/health](http://127.0.0.1:5212/api/health)
- **Desktop (Vite):** [http://127.0.0.1:5173](http://127.0.0.1:5173) — le dados reais de `/api/v1/dashboard/overview`

A variavel `NEXT_PUBLIC_API_URL` em `apps/web/.env.local` e `VITE_API_URL` em `apps/desktop/.env.development` apontam para a API (padrao `http://127.0.0.1:5212`).

### API REST (v1)

- `GET /api/v1/dashboard/overview`
- `GET /api/v1/tickets` · `POST /api/v1/tickets` · `PATCH /api/v1/tickets/{id}`
- `GET /api/v1/devices`
- `POST /api/v1/agent/sync` — agente Windows envia inventario (campo `agentKey` unico por maquina)

Em **Development**, a API aplica migracoes automaticamente ao subir (`MigrateAsync`).

**Seguranca:** a senha do PostgreSQL esta em `appsettings.Development.json` apenas para facilitar o desenvolvimento local. Para nao versionar credenciais, use `dotnet user-secrets` e remova a senha do arquivo.

### Backend
```bash
cd apps/backend
dotnet run
```

### Agente
```bash
cd apps/agent
dotnet run
```

### Web
```bash
cd apps/web
npm run dev
```

### Desktop
```bash
cd apps/desktop
npm run dev
```

### Mobile
```bash
cd apps/mobile
npm start
```

## Paleta VisoHelp
- Branco: base e superficies
- Vermelho: alertas e criticidade
- Azul: acoes primarias
- Preto: estrutura e tema escuro
