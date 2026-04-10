namespace VisoHelp.Api.Domain;

public class Device
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    /// <summary>Chave estavel do agente (upsert).</summary>
    public string AgentKey { get; set; } = string.Empty;
    /// <summary>Cliente cadastrado quando o sync envia codigo publico.</summary>
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public long? TotalRamMb { get; set; }
    public int? TotalDiskGb { get; set; }
    public string? AntivirusSummary { get; set; }
    /// <summary>Nome do processador (WMI).</summary>
    public string? CpuSummary { get; set; }
    /// <summary>Placa(s) de video (WMI Win32_VideoController).</summary>
    public string? GpuSummary { get; set; }
    /// <summary>Ultimo arranque do SO reportado pelo agente (WMI).</summary>
    public DateTimeOffset? LastOsBootAt { get; set; }
    /// <summary>Notas internas editadas no painel.</summary>
    public string? Notes { get; set; }
    public string Hostname { get; set; } = string.Empty;
    public string OperatingSystem { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
    public bool IsOnline { get; set; } = true;
    public DateTimeOffset LastSeenAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
