using System.Diagnostics;
using System.Windows.Forms;
using VisoHelp.Agent;

ApplicationConfiguration.Initialize();

var localRoot = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
var visoDir = Path.Combine(localRoot, "VisoHelp");
var configPath = Path.Combine(visoDir, "config.json");
var targetExe = Path.Combine(visoDir, "VisoHelp.Agent.exe");

if (AgentConfig.NeedsSetup(configPath))
    Application.Run(new SetupWizardForm(configPath, visoDir, targetExe));

if (AgentConfig.NeedsSetup(configPath))
    return;

AgentStartup.EnsureRegisteredInUserRun();

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.AddJsonFile(configPath, optional: true, reloadOnChange: true);

builder.Services.AddSingleton<AgentSyncCoordinator>();
builder.Services.AddHttpClient();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();

var hostThread = new Thread(() =>
{
    try
    {
        host.Run();
    }
    catch (Exception ex)
    {
        Debug.WriteLine(ex);
    }
})
{
    IsBackground = false,
    Name = "VisoHelp.Host"
};

hostThread.Start();

Application.Run(new TrayApplicationContext(host));
