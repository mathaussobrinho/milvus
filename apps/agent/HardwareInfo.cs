using System.Management;
using Microsoft.Win32;

namespace VisoHelp.Agent;

/// <summary>
/// Inventario via WMI. O Worker corre em threadpool (MTA); WMI/COM costuma exigir STA,
/// por isso a recolha completa corre numa unica thread STA (evita CPU/GPU vazios).
/// </summary>
internal static class HardwareInfo
{
    internal readonly record struct SyncSnapshot(
        long? TotalRamMb,
        int? TotalDiskGb,
        string AntivirusSummary,
        string? CpuSummary,
        string? GpuSummary,
        DateTimeOffset? LastOsBootAt,
        int? CpuTempC);

    /// <summary>Recolhe RAM, disco, AV, CPU, GPU e boot numa thread STA.</summary>
    public static SyncSnapshot CollectForSync()
    {
        SyncSnapshot? result = null;
        var t = new Thread(() =>
        {
            try
            {
                var ram = QueryTotalRamMb();
                var disk = QuerySystemDiskGb();
                var av = QueryAntivirusSummary();
                var cpu = QueryCpuFromWmi();
                if (string.IsNullOrWhiteSpace(cpu))
                {
                    Thread.Sleep(200);
                    cpu = QueryCpuFromWmi();
                }
                if (string.IsNullOrWhiteSpace(cpu))
                    cpu = QueryCpuFromRegistry();
                var gpu = QueryGpuSummary();
                var boot = QueryLastOsBootUtc();
                var tempC = QueryCpuTempC();
                result = new SyncSnapshot(ram, disk, av, cpu, gpu, boot, tempC);
            }
            catch
            {
                /* ignore */
            }
        });
        t.SetApartmentState(ApartmentState.STA);
        t.IsBackground = true;
        t.Start();
        if (!t.Join(TimeSpan.FromSeconds(45)))
            return new SyncSnapshot(null, null, "Indisponivel", null, null, null, null);

        return result ?? new SyncSnapshot(null, null, "Indisponivel", null, null, null, null);
    }

    private static long? QueryTotalRamMb()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    if (o["TotalPhysicalMemory"] is ulong bytes)
                        return (long)(bytes / (1024UL * 1024UL));
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

    private static int? QuerySystemDiskGb()
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
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    if (o["Size"] is ulong size)
                        return (int)(size / (1024UL * 1024UL * 1024UL));
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

    private static string QueryAntivirusSummary()
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

    private static string? QueryCpuFromWmi()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name FROM Win32_Processor");
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    var name = o["Name"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(name))
                        return name;
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

    private static string? QueryCpuFromRegistry()
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"HARDWARE\DESCRIPTION\System\CentralProcessor\0");
            var v = key?.GetValue("ProcessorNameString") as string;
            return string.IsNullOrWhiteSpace(v) ? null : v.Trim();
        }
        catch
        {
            return null;
        }
    }

    private static string? QueryGpuSummary()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, VideoProcessor FROM Win32_VideoController");
            var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            string? basicFallback = null;
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    var name = o["Name"]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(name))
                        name = o["VideoProcessor"]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(name))
                        continue;
                    if (name.Contains("Microsoft Basic Render Driver", StringComparison.OrdinalIgnoreCase) ||
                        name.Contains("Microsoft Basic Display", StringComparison.OrdinalIgnoreCase))
                    {
                        basicFallback ??= name;
                        continue;
                    }

                    names.Add(name);
                }
                finally
                {
                    o.Dispose();
                }
            }

            if (names.Count > 0)
                return string.Join(" · ", names);
            return basicFallback;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Temperatura aproximada (ACPI/WMI). Muitos desktops nao expoem sensores; retorna null.
    /// </summary>
    private static int? QueryCpuTempC()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(@"root\WMI", "SELECT CurrentTemperature FROM MSAcpi_ThermalZoneTemperature");
            foreach (ManagementObject o in searcher.Get())
            {
                try
                {
                    var raw = o["CurrentTemperature"];
                    if (raw is int tenthsKelvin)
                    {
                        var kelvin = tenthsKelvin / 10.0;
                        var c = (int)Math.Round(kelvin - 273.15);
                        if (c >= -40 && c <= 120)
                            return c;
                    }
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

    private static DateTimeOffset? QueryLastOsBootUtc()
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
