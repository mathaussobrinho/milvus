using System.Text.Json;

namespace VisoHelp.Agent;

/// <summary>Logs de depuração (sessão 0dde62) — NDJSON em LocalAppData\VisoHelp.</summary>
internal static class DebugSessionLog
{
    private const string SessionId = "0dde62";

    internal static void Append(string hypothesisId, string location, object data)
    {
        try
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "VisoHelp");
            Directory.CreateDirectory(dir);
            var path = Path.Combine(dir, "debug-0dde62.ndjson");
            var line = JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["sessionId"] = SessionId,
                ["hypothesisId"] = hypothesisId,
                ["location"] = location,
                ["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                ["data"] = data
            });
            File.AppendAllText(path, line + Environment.NewLine);
        }
        catch
        {
            /* ignore */
        }
    }
}
