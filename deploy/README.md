# Deploy VisoHelp (Docker na VPS)

Stack: **API** (.NET 9) + **Web** (Next.js) em containers. O **Postgres** fica num container **ja existente** na mesma VPS; este compose **nao** cria Postgres.

## Pré-requisitos

- Docker e Docker Compose na VPS.
- Container Postgres a correr e rede Docker conhecida.
- DNS `api.*` e `app.*` (ou subdomínios escolhidos) a apontar para a VPS; **HTTPS** no Nginx/Caddy com certificado válido (cadeia completa).

## 1. Rede Docker partilhada com o Postgres

Liste redes e o nome do container do Postgres:

```bash
docker network ls
docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' <id_ou_nome_container_postgres>
```

Defina em `.env`:

```env
EXTERNAL_DOCKER_NETWORK=nome_da_rede_do_postgres
```

## 2. Connection string

O **Host** na connection string deve ser o **nome DNS do servico Postgres dentro dessa rede** (ex.: `postgres`, `db`), **nao** `localhost`.

Exemplo:

```env
POSTGRES_CONNECTION_STRING='Host=postgres;Port=5432;Database=visohelp;Username=visohelp;Password=SECRETO'
```

Se editar o `.env` manualmente no bash, **não** faça `source .env` com um valor sem aspas: o `;` na connection string é interpretado como fim de comando. O Docker Compose lê o ficheiro `.env` corretamente; o script `deploy/migrate-vps.sh` usa `grep` para extrair a string.

Crie a base `visohelp` (ou o nome que usar) e um utilizador com permissões antes da primeira subida, se ainda não existirem.

## 3. Variáveis de ambiente

```bash
cp .env.example .env
# Editar .env: EXTERNAL_DOCKER_NETWORK, POSTGRES_CONNECTION_STRING, JWT_KEY, URLs
```

`JWT_KEY` deve ter pelo menos o mesmo tamanho exigido pela configuração JWT em produção (ex.: 32+ caracteres).

Defina **`MASTER_ANALYST_EMAIL`** e **`MASTER_ANALYST_PASSWORD`** no `.env`. Sem estes valores, o arranque em produção **não** cria o primeiro analista (`MasterAnalystBootstrap`), a base fica sem utilizadores e o login em `/api/v1/auth/login` responde **401**. Após editar, execute `docker compose up -d api` para recriar o contentor com as novas variáveis.

## 4. Migrações EF

O `Program.cs` aplica migrações automaticamente apenas em **Development**. Em **Production**, aplique uma vez a partir da sua máquina (com acesso à base) ou num job pontual:

```bash
cd apps/backend
dotnet ef database update --connection "<sua connection string>"
```

Ou exponha temporariamente a porta Postgres e execute o comando acima.

## 5. Build e subida

Na **raiz do repositório**:

```bash
docker compose build
docker compose up -d
```

Portas por defeito no host: API `5212`, Web `3000` (ajustáveis com `API_HOST_PORT` / `WEB_HOST_PORT` no `.env`).

## 6. Reverse proxy (Nginx exemplo)

- `https://api.dizparo.com.br` → `http://127.0.0.1:5212`
- `https://app.dizparo.com.br` → `http://127.0.0.1:<WEB_HOST_PORT>` (ex.: `3000` ou `3010` se a 3000 estiver ocupada)

Existe um modelo em [`nginx-visohelp-dizparo.conf`](nginx-visohelp-dizparo.conf) (`app`/`api` com `proxy_pass` e `WebSocket`). Depois de ativar o site e `nginx -t`, use **HTTPS** com certificado, por exemplo:

`certbot --nginx -d app.dizparo.com.br -d api.dizparo.com.br`

**Importante:** o ficheiro `sites-available/dizparo.com.br` que aponta o domínio **raiz** para outra app (ex. 3080) **não** inclui subdomínios `app` nem `api`. Sem `server_name` para `app.dizparo.com.br`, o Nginx devolve **404** do site por defeito. É preciso um `server` dedicado (como no modelo acima).

Garanta `proxy_set_header Host`, `X-Forwarded-Proto`, `X-Forwarded-For` se usar autenticação ou cookies.

## 7. Pacote do agente (download no painel)

Antes do `docker compose build` da **web**, copie o ZIP gerado por `installer/publish-release.ps1` para:

`apps/web/public/downloads/VisoHelp.Agent.zip`

O mesmo script gera ou copia `Desinstalar-VisoHelp-Agent.cmd` para `release\` e inclui-o no ZIP; mantenha também uma cópia em `apps/web/public/downloads/Desinstalar-VisoHelp-Agent.cmd` (já versionada no repositório) para o link de desinstalação no painel.

Assim a página **Configurações > Agente** serve os ficheiros estáticos (pacote e desinstalador).

## Resolução de problemas

- **SSL no agente Windows**: erro ao validar KEY → corrigir certificado/cadeia no proxy (fullchain).
- **API não liga ao Postgres**: verificar `EXTERNAL_DOCKER_NETWORK`, nome do `Host=` na connection string e se o container da API está na mesma rede (`docker network inspect <rede>`).
