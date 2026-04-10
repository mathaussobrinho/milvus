# Gera UM unico VisoHelp.Agent.exe (self-contained + single-file) em release/
# Nao exige .NET instalado no PC do cliente. Nao exige Inno Setup.
# Uso: na raiz do repo ou: powershell -File installer\publish-release.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "release"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "Publicando agente (self-contained, single-file)... pode levar alguns minutos."

dotnet publish "$root\apps\agent\VisoHelp.Agent.csproj" `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -o $outDir `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true

if (-not (Test-Path (Join-Path $outDir "VisoHelp.Agent.exe"))) {
    Write-Error "Falha: VisoHelp.Agent.exe nao encontrado em $outDir"
}

# PublishSingleFile nem sempre deixa appsettings junto do .exe; copiar explicitamente
# para o assistente carregar appsettings.Production.json (URLs HTTPS em producao).
$agentDir = Join-Path $root "apps\agent"
Copy-Item (Join-Path $agentDir "appsettings.json") (Join-Path $outDir "appsettings.json") -Force
Copy-Item (Join-Path $agentDir "appsettings.Production.json") (Join-Path $outDir "appsettings.Production.json") -Force

$zipPath = Join-Path $root "release\VisoHelp.Agent.zip"
$readme = Join-Path $PSScriptRoot "INSTALAR.txt"
$uninstallCmd = Join-Path $PSScriptRoot "Desinstalar-VisoHelp-Agent.cmd"
Remove-Item $zipPath -ErrorAction SilentlyContinue

$exePath = Join-Path $outDir "VisoHelp.Agent.exe"
$jsonPath = Join-Path $outDir "appsettings.json"
$prodJsonPath = Join-Path $outDir "appsettings.Production.json"
$items = @($exePath)
if (Test-Path $jsonPath) { $items += $jsonPath }
if (Test-Path $prodJsonPath) { $items += $prodJsonPath }
if (Test-Path $readme) { $items += $readme }
if (Test-Path $uninstallCmd) { Copy-Item $uninstallCmd (Join-Path $outDir "Desinstalar-VisoHelp-Agent.cmd") -Force; $items += (Join-Path $outDir "Desinstalar-VisoHelp-Agent.cmd") }

Compress-Archive -LiteralPath $items -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "Pronto:"
Write-Host "  Executavel (distribuir): $exePath"
Write-Host "  ZIP opcional:            $zipPath"
Write-Host ""
Write-Host "Na primeira execucao o assistente pede apenas a KEY (URLs em appsettings.Production.json)."
Write-Host ""
