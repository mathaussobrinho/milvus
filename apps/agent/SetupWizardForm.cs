using System.Diagnostics;
using System.Text.Json;
using System.Windows.Forms;
using Microsoft.Extensions.Configuration;

namespace VisoHelp.Agent;

public sealed class SetupWizardForm : Form
{
    private readonly string _configPath;
    private readonly string _visoDir;
    private readonly string _targetExe;
    private readonly IConfiguration _installConfig;
    private readonly TextBox _keyBox;
    private readonly Button _installBtn;

    public SetupWizardForm(string configPath, string visoDir, string targetExe)
    {
        _configPath = configPath;
        _visoDir = visoDir;
        _targetExe = targetExe;
        _installConfig = InstallConfigLoader.Build();

        Text = "VisoHelp — Configuracao inicial";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        Padding = new Padding(16);

        var apiDisplay = InstallConfigLoader.GetApiBase(_installConfig);
        var webDisplay = InstallConfigLoader.GetWebBaseUrl(_installConfig);

        var table = new TableLayoutPanel
        {
            ColumnCount = 2,
            AutoSize = true,
            Padding = new Padding(0)
        };
        table.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 160));
        table.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 360));

        var intro = new Label
        {
            Text = "Informe apenas a KEY publica do cliente (cadastro em Clientes). As URLs do ambiente ja estao configuradas. A KEY sera validada na API antes de instalar.",
            AutoSize = true,
            MaximumSize = new Size(520, 0)
        };
        table.SetColumnSpan(intro, 2);
        table.Controls.Add(intro, 0, 0);

        table.Controls.Add(new Label { Text = "Codigo (KEY):", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 1);
        _keyBox = new TextBox { Width = 320, MaxLength = 8 };
        table.Controls.Add(_keyBox, 1, 1);

        table.Controls.Add(new Label { Text = "API (automatico):", AutoSize = true }, 0, 2);
        var apiLabel = new Label
        {
            Text = apiDisplay,
            AutoSize = true,
            MaximumSize = new Size(360, 0),
            ForeColor = System.Drawing.Color.DimGray
        };
        table.Controls.Add(apiLabel, 1, 2);

        table.Controls.Add(new Label { Text = "Site (automatico):", AutoSize = true }, 0, 3);
        var webLabel = new Label
        {
            Text = webDisplay,
            AutoSize = true,
            MaximumSize = new Size(360, 0),
            ForeColor = System.Drawing.Color.DimGray
        };
        table.Controls.Add(webLabel, 1, 3);

        _installBtn = new Button
        {
            Text = "Verificar e instalar",
            AutoSize = true
        };
        _installBtn.Click += async (_, _) => await InstallAsync();

        var cancelBtn = new Button { Text = "Cancelar", AutoSize = true, DialogResult = DialogResult.Cancel };

        var flow = new FlowLayoutPanel { FlowDirection = FlowDirection.RightToLeft, AutoSize = true, Padding = new Padding(0) };
        flow.Controls.Add(_installBtn);
        flow.Controls.Add(cancelBtn);

        table.SetColumnSpan(flow, 2);
        table.Controls.Add(flow, 0, 4);

        Controls.Add(table);
    }

    private async Task InstallAsync()
    {
        var key = _keyBox.Text.Trim().ToUpperInvariant();
        var api = InstallConfigLoader.GetApiBase(_installConfig);
        var web = InstallConfigLoader.GetWebBaseUrl(_installConfig);

        if (string.IsNullOrWhiteSpace(key))
        {
            MessageBox.Show(this, "Informe a KEY publica do cliente.", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        _installBtn.Enabled = false;
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            var url = $"{api}/api/v1/public/client-by-code?code={Uri.EscapeDataString(key)}";
            var res = await http.GetAsync(url);
            if (!res.IsSuccessStatusCode)
            {
                MessageBox.Show(this,
                    "KEY invalida ou API inacessivel. Verifique o codigo e a conexao.",
                    Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(this,
                "Nao foi possivel validar na API: " + ex.Message,
                Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        finally
        {
            _installBtn.Enabled = true;
        }

        try
        {
            Directory.CreateDirectory(_visoDir);

            var cfgRoot = new Dictionary<string, object>
            {
                ["VisoHelp"] = new Dictionary<string, string>
                {
                    ["ApiBase"] = api,
                    ["ClientPublicCode"] = key,
                    ["WebBaseUrl"] = web
                }
            };
            File.WriteAllText(_configPath,
                JsonSerializer.Serialize(cfgRoot, new JsonSerializerOptions { WriteIndented = true }));

            var sourceExe = Environment.ProcessPath ?? Environment.GetCommandLineArgs()[0];
            var sourceDir = Path.GetDirectoryName(sourceExe) ?? "";
            CopyAppSettingsFiles(sourceDir, _visoDir);

            var fullSource = Path.GetFullPath(sourceExe);
            var fullTarget = Path.GetFullPath(_targetExe);

            if (!string.Equals(fullSource, fullTarget, StringComparison.OrdinalIgnoreCase))
            {
                File.Copy(fullSource, fullTarget, true);
                RegisterRun(fullTarget);
                CreateDesktopShortcut(web, key);

                MessageBox.Show(this,
                    "Instalacao concluida. O VisoHelp sera aberto a partir da pasta do aplicativo.",
                    Text, MessageBoxButtons.OK, MessageBoxIcon.Information);

                Process.Start(new ProcessStartInfo { FileName = fullTarget, UseShellExecute = true });
                Application.Exit();
                return;
            }

            RegisterRun(fullTarget);
            CreateDesktopShortcut(web, key);

            DialogResult = DialogResult.OK;
            Close();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "Erro ao instalar: " + ex.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static void CopyAppSettingsFiles(string sourceDir, string destDir)
    {
        foreach (var name in new[] { "appsettings.json", "appsettings.Development.json", "appsettings.Production.json" })
        {
            var src = Path.Combine(sourceDir, name);
            if (File.Exists(src))
                File.Copy(src, Path.Combine(destDir, name), true);
        }
    }

    private static void RegisterRun(string exePath)
    {
        using var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(
            @"Software\Microsoft\Windows\CurrentVersion\Run", true);
        key?.SetValue("VisoHelpAgent", $"\"{exePath}\"", Microsoft.Win32.RegistryValueKind.String);
    }

    private static void CreateDesktopShortcut(string webBase, string key)
    {
        try
        {
            var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            var path = Path.Combine(desktop, "VisoHelp Abrir chamado.url");
            var agentKey = AgentKeyStore.GetOrCreate();
            var url =
                $"{webBase}/abrir-chamado?key={Uri.EscapeDataString(key)}&agentKey={Uri.EscapeDataString(agentKey)}";
            File.WriteAllText(path,
                "[InternetShortcut]\r\nURL=" + url + "\r\n");
        }
        catch
        {
            /* ignore */
        }
    }
}
