using System.Net.Http.Json;
using System.Net.NetworkInformation;

namespace VisoHelp.Agent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly string _agentKey = AgentKeyStore.GetOrCreate();

    public Worker(
        ILogger<Worker> logger,
        IHttpClientFactory httpFactory,
        IConfiguration config)
    {
        _logger = logger;
        _httpFactory = httpFactory;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var baseUrl = _config["VisoHelp:ApiBase"]?.Trim().TrimEnd('/') ?? "http://127.0.0.1:5212";
        var clientName = _config["VisoHelp:ClientName"]?.Trim();
        if (string.IsNullOrEmpty(clientName))
            clientName = Environment.MachineName;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var client = _httpFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(30);

                var body = new
                {
                    agentKey = _agentKey,
                    hostname = Environment.MachineName,
                    username = Environment.UserName,
                    operatingSystem = Environment.OSVersion.VersionString,
                    ipAddress = GetPrimaryIPv4(),
                    macAddress = GetPrimaryMac(),
                    clientName
                };

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

            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
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
