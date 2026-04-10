using System.Diagnostics;
using System.Windows.Forms;

namespace VisoHelp.Agent;

public sealed class TrayApplicationContext : ApplicationContext
{
    private readonly IHost _host;
    private readonly NotifyIcon _notifyIcon;

    public TrayApplicationContext(IHost host)
    {
        _host = host;
        var sync = host.Services.GetRequiredService<AgentSyncCoordinator>();
        var config = host.Services.GetRequiredService<IConfiguration>();

        _notifyIcon = new NotifyIcon
        {
            Icon = System.Drawing.SystemIcons.Application,
            Visible = true,
            Text = "VisoHelp"
        };

        var menu = new ContextMenuStrip();
        menu.Items.Add("Abrir chamado", null, (_, _) => OpenChamado(config));
        menu.Items.Add("Sincronizar agora", null, (_, _) => _ = sync.RequestSyncNowAsync());
        menu.Items.Add("Sair", null, (_, _) => _ = ExitAppAsync());

        _notifyIcon.ContextMenuStrip = menu;
        _notifyIcon.DoubleClick += (_, _) => OpenChamado(config);
    }

    private static void OpenChamado(IConfiguration config)
    {
        var web = config["VisoHelp:WebBaseUrl"]?.Trim().TrimEnd('/') ?? "http://localhost:3000";
        var code = config["VisoHelp:ClientPublicCode"]?.Trim() ?? "";
        var agentKey = AgentKeyStore.GetOrCreate();
        var url = string.IsNullOrEmpty(code)
            ? $"{web}/abrir-chamado?agentKey={Uri.EscapeDataString(agentKey)}"
            : $"{web}/abrir-chamado?key={Uri.EscapeDataString(code)}&agentKey={Uri.EscapeDataString(agentKey)}";

        try
        {
            Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
        }
        catch
        {
            /* ignore */
        }
    }

    private async Task ExitAppAsync()
    {
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
        try
        {
            await _host.StopAsync(TimeSpan.FromSeconds(15));
        }
        catch
        {
            /* ignore */
        }

        Application.Exit();
    }
}
