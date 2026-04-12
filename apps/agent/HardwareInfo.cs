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
                // #region agent log
                DebugSessionLog.Append(
                    "H1-H3",
                    "HardwareInfo.CollectForSync:STA_done",
                    new
                    {
                        ramMb = ram,
                        diskGb = disk,
                        avLen = av?.Length ?? 0,
                        cpuLen = cpu?.Length ?? 0,
                        gpuLen = gpu?.Length ?? 0,
                        hasBoot = boot.HasValue,
                        tempC
                    });
                // #endregion
            }
            catch (Exception ex)
            {
                // #region agent log
                DebugSessionLog.Append(
                    "H4",
                    "HardwareInfo.CollectForSync:STA_exception",
                    new { exType = ex.GetType().Name, exMessage = ex.Message });
                // #endregion
            }
        });
        t.SetApartmentState(ApartmentState.STA);
        t.IsBackground = true;
        t.Start();
        if (!t.Join(TimeSpan.FromSeconds(45)))
        {
            // #region agent log
            DebugSessionLog.Append("H3", "HardwareInfo.CollectForSync:timeout_45s", new { });
            // #endregion
            return new SyncSnapshot(null, null, "Indisponivel", null, null, null, null);
        }

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
        var rowCount = 0;
        try
        {
            var scope = new ManagementScope(@"\\.\root\cimv2");
            scope.Connect();
            var query = new ObjectQuery("SELECT Name, Manufacturer FROM Win32_Processor");
            using var searcher = new ManagementObjectSearcher(scope, query);
            foreach (ManagementObject o in searcher.Get())
            {
                rowCount++;
                try
                {
                    var name = o["Name"]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(name))
                        name = o["Manufacturer"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(name))
                    {
                        // #region agent log
                        DebugSessionLog.Append(
                            "H3",
                            "QueryCpuFromWmi:hit",
                            new { rowCount, runId = "post-fix" });
                        // #endregion
                        return name;
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

        // #region agent log
        DebugSessionLog.Append("H3", "QueryCpuFromWmi:no_hit", new { rowCount });
        // #endregion
        return null;
    }

    private static string? QueryCpuFromRegistry()
    {
        foreach (var view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
        {
            try
            {
                using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view);
                using var key = baseKey.OpenSubKey(@"HARDWARE\DESCRIPTION\System\CentralProcessor\0");
                var v = key?.GetValue("ProcessorNameString") as string;
                if (!string.IsNullOrWhiteSpace(v))
                {
                    // #region agent log
                    DebugSessionLog.Append(
                        "H3",
                        "QueryCpuFromRegistry:hit",
                        new { view = view.ToString(), runId = "post-fix" });
                    // #endregion
                    return v.Trim();
                }
            }
            catch
            {
                /* ignore */
            }
        }

        return null;
    }

    private static string? QueryGpuSummary()
    {
        try
        {
            var scope = new ManagementScope(@"\\.\root\cimv2");
            scope.Connect();
            var query = new ObjectQuery("SELECT Name, VideoProcessor, Description FROM Win32_VideoController");
            using var searcher = new ManagementObjectSearcher(scope, query);
            var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            string? basicFallback = null;
            var gpuRows = 0;
            foreach (ManagementObject o in searcher.Get())
            {
                gpuRows++;
                try
                {
                    var name = o["Name"]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(name))
                        name = o["VideoProcessor"]?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(name))
                        name = o["Description"]?.ToString()?.Trim();
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
            {
                // #region agent log
                DebugSessionLog.Append(
                    "H3",
                    "QueryGpuSummary:hit",
                    new { gpuRows, count = names.Count, runId = "post-fix" });
                // #endregion
                return string.Join(" · ", names);
            }

            // #region agent log
            DebugSessionLog.Append("H3", "QueryGpuSummary:fallback_only", new { gpuRows, hasBasic = basicFallback != null });
            // #endregion
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
    /// <summary>
    /// ACPI devolve CurrentTemperature em decimos de Kelvin (ex.: UInt16). Antes so aceitavamos int.
    /// </summary>
    private static int? TryConvertAcpiThermalTenthsKelvinToC(object? raw)
    {
        if (raw is null)
            return null;
        double tenths;
        try
        {
            tenths = raw switch
            {
                ushort u => u,
                short s => s,
                uint ui => ui,
                int i => i,
                long l => l,
                ulong ul => ul,
                byte b => b,
                _ => Convert.ToDouble(raw, System.Globalization.CultureInfo.InvariantCulture)
            };
        }
        catch
        {
            return null;
        }

        if (tenths <= 0)
            return null;
        var kelvin = tenths / 10.0;
        var c = (int)Math.Round(kelvin - 273.15);
        if (c >= -40 && c <= 120)
            return c;
        return null;
    }

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
                    // #region agent log
                    DebugSessionLog.Append(
                        "H1",
                        "QueryCpuTempC:raw",
                        new { rawType = raw?.GetType().FullName, rawStr = raw?.ToString() });
                    // #endregion
                    var c = TryConvertAcpiThermalTenthsKelvinToC(raw);
                    if (c.HasValue)
                    {
                        // #region agent log
                        DebugSessionLog.Append(
                            "H1",
                            "QueryCpuTempC:convertedC",
                            new { c = c.Value, runId = "post-fix" });
                        // #endregion
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
                    // #region agent log
                    DebugSessionLog.Append(
                        "H2",
                        "QueryLastOsBootUtc:raw",
                        new { rawType = raw?.GetType().FullName, rawStr = raw?.ToString() });
                    // #endregion
                    if (raw is string s)
                    {
                        var bootFromString = new DateTimeOffset(ManagementDateTimeConverter.ToDateTime(s));
                        DebugSessionLog.Append(
                            "H2",
                            "QueryLastOsBootUtc:parsed",
                            new { fromString = true, runId = "post-fix" });
                        return bootFromString;
                    }
                    if (raw is DateTime dt)
                    {
                        DebugSessionLog.Append(
                            "H2",
                            "QueryLastOsBootUtc:parsed",
                            new { fromDateTime = true, runId = "post-fix" });
                        return new DateTimeOffset(dt);
                    }
                    if (raw is DateTimeOffset dtoRaw)
                    {
                        DebugSessionLog.Append(
                            "H2",
                            "QueryLastOsBootUtc:parsed",
                            new { fromDto = true, runId = "post-fix" });
                        return dtoRaw;
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
}
