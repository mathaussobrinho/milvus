using System.Management;

namespace VisoHelp.Agent;

internal static class HardwareInfo
{
    public static long? TryGetTotalRamMb()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
            foreach (var o in searcher.Get())
            {
                if (o["TotalPhysicalMemory"] is ulong bytes)
                    return (long)(bytes / (1024UL * 1024UL));
            }
        }
        catch
        {
            /* ignore */
        }

        return null;
    }

    public static int? TryGetSystemDiskGb()
    {
        try
        {
            var sys = Environment.GetFolderPath(Environment.SpecialFolder.System);
            var root = Path.GetPathRoot(sys) ?? "C:\\";
            var letter = root.TrimEnd('\\', '/');
            if (string.IsNullOrEmpty(letter))
                letter = "C:";
            using var searcher = new ManagementObjectSearcher(
                $"SELECT Size FROM Win32_LogicalDisk WHERE DeviceID='{letter.Replace("'", "''")}'");
            foreach (var o in searcher.Get())
            {
                if (o["Size"] is ulong size)
                    return (int)(size / (1024UL * 1024UL * 1024UL));
            }
        }
        catch
        {
            /* ignore */
        }

        return null;
    }

    public static string TryGetAntivirusSummary()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(@"root\SecurityCenter2", "SELECT * FROM AntiVirusProduct");
            var names = new List<string>();
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    var dn = o["displayName"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(dn))
                        names.Add(dn.Trim());
                }
                finally
                {
                    o.Dispose();
                }
            }

            return names.Count > 0 ? string.Join(", ", names.Distinct()) : "Nao detectado";
        }
        catch
        {
            return "Indisponivel";
        }
    }

    public static string? TryGetCpuName()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_Processor");
            foreach (var o in searcher.Get())
            {
                var name = o["Name"]?.ToString()?.Trim();
                if (!string.IsNullOrEmpty(name))
                    return name;
            }
        }
        catch
        {
            /* ignore */
        }

        return null;
    }

    /// <summary>Ultimo boot do SO (UTC aproximado conforme WMI).</summary>
    public static DateTimeOffset? TryGetLastOsBootUtc()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT LastBootUpTime FROM Win32_OperatingSystem");
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    var raw = o["LastBootUpTime"];
                    if (raw is string s)
                        return new DateTimeOffset(ManagementDateTimeConverter.ToDateTime(s));
                }
                finally
                {
                    o.Dispose();
                }
            }
        }
        catch
        {
            /* ignore */
        }

        return null;
    }
}
