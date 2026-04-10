; Opcional: Inno Setup (nao e mais necessario para distribuir o produto).
; O fluxo principal e: powershell -File installer\publish-release.ps1
;   -> gera release\VisoHelp.Agent.exe (self-contained, ~100MB) com assistente integrado.
; Se ainda quiser um Setup.exe separado, publique o agente framework-dependent single-file:
;   dotnet publish ..\apps\agent\VisoHelp.Agent.csproj -c Release -r win-x64 --self-contained false -o ..\apps\agent\bin\Release\net9.0-windows\publish

#define MyAppName "VisoHelp Agente"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "VisoHelp"
#define AgentPublishDir "..\apps\agent\bin\Release\net9.0-windows\publish"

[Setup]
AppId={{B8E2F9A1-4C3D-4E5F-9A0B-1D2E3F4A5B6C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\VisoHelp
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=VisoHelpAgentSetup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
; Agente single-file (sem copiar .pdb)
Source: "{#AgentPublishDir}\VisoHelp.Agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#AgentPublishDir}\appsettings.json"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "VisoHelpAgent"; ValueData: """{app}\VisoHelp.Agent.exe"""; Flags: uninsdeletevalue

[Code]
var
  ConfigPage: TInputQueryWizardPage;

procedure InitializeWizard;
begin
  ConfigPage := CreateInputQueryPage(wpWelcome,
    'Configuracao',
    'Informe a KEY publica do cliente e as URLs.',
    'A KEY sera validada com a API antes de concluir.');
  ConfigPage.Add('Codigo publico (KEY):', False);
  ConfigPage.Add('URL da API (sem barra no final):', False);
  ConfigPage.Add('URL do site (abrir chamado):', False);
  ConfigPage.Values[0] := '';
  ConfigPage.Values[1] := 'https://api.dizparo.com.br';
  ConfigPage.Values[2] := 'https://app.dizparo.com.br';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  path: String;
  script: String;
  code: Integer;
begin
  Result := True;
  if CurPageID = ConfigPage.ID then
  begin
    if Trim(ConfigPage.Values[0]) = '' then
    begin
      MsgBox('Informe a KEY publica do cliente.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    path := ExpandConstant('{tmp}\visohelp-validate.ps1');
    script := '$ErrorActionPreference = "Stop"' + #13#10 +
      '$u = "' + ConfigPage.Values[1] + '/api/v1/public/client-by-code?code=' + ConfigPage.Values[0] + '"' + #13#10 +
      'Invoke-RestMethod -Uri $u -Method Get | Out-Null' + #13#10;
    SaveStringToFile(path, script, False);
    if Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -File "' + path + '"', '', SW_HIDE, ewWaitUntilTerminated, code) then
    begin
      if code <> 0 then
      begin
        MsgBox('Nao foi possivel validar a KEY na API. Verifique o codigo, a URL e a conexao.', mbError, MB_OK);
        Result := False;
      end;
    end
    else
      Result := False;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  cfg: String;
  url: String;
  desktop: String;
begin
  if CurStep = ssPostInstall then
  begin
    cfg :=
      '{' + #13#10 +
      '  "VisoHelp": {' + #13#10 +
      '    "ApiBase": "' + ConfigPage.Values[1] + '",' + #13#10 +
      '    "ClientPublicCode": "' + ConfigPage.Values[0] + '",' + #13#10 +
      '    "WebBaseUrl": "' + ConfigPage.Values[2] + '"' + #13#10 +
      '  }' + #13#10 +
      '}';
    SaveStringToFile(ExpandConstant('{app}\config.json'), cfg, False);

    url := ConfigPage.Values[2] + '/abrir-chamado?key=' + ConfigPage.Values[0];
    desktop := ExpandConstant('{userdesktop}\VisoHelp Abrir chamado.url');
    SaveStringToFile(desktop,
      '[InternetShortcut]' + #13#10 + 'URL=' + url + #13#10,
      False);
  end;
end;
