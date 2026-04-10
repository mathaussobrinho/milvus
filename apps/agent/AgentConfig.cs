using System.Text.Json;

namespace VisoHelp.Agent;

internal static class AgentConfig
{
    public static bool NeedsSetup(string configPath)
    {
        if (!File.Exists(configPath))
            return true;

        try
        {
            var json = File.ReadAllText(configPath);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("VisoHelp", out var vh))
                return true;
            var code = vh.TryGetProperty("ClientPublicCode", out var c) ? c.GetString() : null;
            return string.IsNullOrWhiteSpace(code);
        }
        catch
        {
            return true;
        }
    }
}
