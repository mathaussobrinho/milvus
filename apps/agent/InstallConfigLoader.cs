using Microsoft.Extensions.Configuration;

namespace VisoHelp.Agent;

internal static class InstallConfigLoader
{
    public static IConfiguration Build()
    {
        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Production";
        return new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: false)
            .Build();
    }

    public static string GetApiBase(IConfiguration config) =>
        (config["VisoHelp:ApiBase"] ?? "http://127.0.0.1:5212").Trim().TrimEnd('/');

    public static string GetWebBaseUrl(IConfiguration config) =>
        (config["VisoHelp:WebBaseUrl"] ?? "http://localhost:3000").Trim().TrimEnd('/');
}
