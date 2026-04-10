using Microsoft.Win32;

namespace VisoHelp.Agent;

internal static class AgentStartup
{
    private const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string RunValueName = "VisoHelpAgent";

    /// <summary>
    /// Garante entrada no Run apontando para este executavel (idempotente).
    /// </summary>
    internal static void EnsureRegisteredInUserRun()
    {
        try
        {
            var exe = Environment.ProcessPath;
            if (string.IsNullOrEmpty(exe)) return;
            var full = Path.GetFullPath(exe);
            var expected = $"\"{full}\"";

            using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: true);
            if (key is null) return;

            var current = key.GetValue(RunValueName)?.ToString()?.Trim();
            if (string.Equals(current, expected, StringComparison.OrdinalIgnoreCase))
                return;

            key.SetValue(RunValueName, expected, RegistryValueKind.String);
        }
        catch
        {
            /* ignore */
        }
    }
}
