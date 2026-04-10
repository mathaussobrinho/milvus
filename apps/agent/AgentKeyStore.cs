namespace VisoHelp.Agent;

internal static class AgentKeyStore
{
    internal static string GetOrCreate()
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "VisoHelp");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, "agent.key");
        if (File.Exists(path))
        {
            var existing = File.ReadAllText(path).Trim();
            if (!string.IsNullOrEmpty(existing))
                return existing;
        }

        var key = Guid.NewGuid().ToString("N");
        File.WriteAllText(path, key);
        return key;
    }
}
