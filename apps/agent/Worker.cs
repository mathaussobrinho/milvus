using System.Net.Http.Json;
using System.Net.NetworkInformation;

namespace VisoHelp.Agent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly AgentSyncCoordinator _syncCoordinator;
    private readonly string _agentKey = AgentKeyStore.GetOrCreate();
    private readonly SemaphoreSlim _syncGate = new(1, 1);

    public Worker(
        ILogger<Worker> logger,
        IHttpClientFactory httpFactory,
        IConfiguration config,
        AgentSyncCoordinator syncCoordinator)
    {
        _logger = logger;
        _httpFactory = httpFactory;
        _config = config;
        _syncCoordinator = syncCoordinator;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RunSyncOnceAsync(stoppingToken);

        var periodic = RunPeriodicAsync(stoppingToken);
        var immediate = RunImmediateChannelAsync(stoppingToken);
        await Task.WhenAll(periodic, immediate);
    }

    private async Task RunPeriodicAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await RunSyncOnceAsync(stoppingToken);
        }
    }

    private async Task RunImmediateChannelAsync(CancellationToken stoppingToken)
    {
        await foreach (var _ in _syncCoordinator.Reader.ReadAllAsync(stoppingToken))
            await RunSyncOnceAsync(stoppingToken);
    }

    private async Task RunSyncOnceAsync(CancellationToken stoppingToken)
    {
        if (!await _syncGate.WaitAsync(0, stoppingToken))
            return;

        try
        {
            await DoSyncAsync(stoppingToken);
        }
        finally
        {
            _syncGate.Release();
        }
    }

    private async Task DoSyncAsync(CancellationToken stoppingToken)
    {
        var baseUrl = _config["VisoHelp:ApiBase"]?.Trim().TrimEnd('/') ?? "http://127.0.0.1:5212";
        var publicCode = _config["VisoHelp:ClientPublicCode"]?.Trim() ?? "";
        var clientName = _config["VisoHelp:ClientName"]?.Trim();
        if (string.IsNullOrEmpty(clientName))
            clientName = Environment.MachineName;

        var ramMb = HardwareInfo.TryGetTotalRamMb();
        var diskGb = HardwareInfo.TryGetSystemDiskGb();
        var av = HardwareInfo.TryGetAntivirusSummary();
        var cpu = HardwareInfo.TryGetCpuName();
        var lastBoot = HardwareInfo.TryGetLastOsBootUtc();

        try
        {
            var client = _httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            var body = new Dictionary<string, object?>
            {
                ["agentKey"] = _agentKey,
                ["hostname"] = Environment.MachineName,
                ["username"] = Environment.UserName,
                ["operatingSystem"] = Environment.OSVersion.VersionString,
                ["ipAddress"] = GetPrimaryIPv4(),
                ["macAddress"] = GetPrimaryMac(),
                ["clientName"] = clientName
            };

            if (!string.IsNullOrWhiteSpace(publicCode))
                body["clientPublicCode"] = publicCode;
            if (ramMb.HasValue)
                body["totalRamMb"] = ramMb.Value;
            if (diskGb.HasValue)
                body["totalDiskGb"] = diskGb.Value;
            body["antivirusSummary"] = av;
            if (!string.IsNullOrWhiteSpace(cpu))
                body["cpuSummary"] = cpu;
            if (lastBoot.HasValue)
                body["lastOsBootAt"] = lastBoot.Value;

            var response = await client.PostAsJsonAsync(
                $"{baseUrl}/api/v1/agent/sync",
                body,
                stoppingToken);

            if (response.IsSuccessStatusCode)
                _logger.LogInformation("VisoHelp: inventario sincronizado com a API.");
            else
                _logger.LogWarning(
                    "VisoHelp: falha ao sincronizar ({Status}). API em {Base}",
                    (int)response.StatusCode,
                    baseUrl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "VisoHelp: erro ao contatar a API.");
        }
    }

    private static string GetPrimaryIPv4()
    {
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up)
                    continue;
                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;
                var ip = ni.GetIPProperties().UnicastAddresses
                    .FirstOrDefault(a => a.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                if (ip != null)
                    return ip.Address.ToString();
            }
        }
        catch
        {
            /* ignore */
        }

        return "";
    }

    private static string GetPrimaryMac()
    {
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up)
                    continue;
                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;
                var mac = ni.GetPhysicalAddress().ToString();
                if (mac.Length >= 12)
                    return string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
            }
        }
        catch
        {
            /* ignore */
        }

        return "";
    }
}
