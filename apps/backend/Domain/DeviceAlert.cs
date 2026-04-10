namespace VisoHelp.Api.Domain;

public class DeviceAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DeviceId { get; set; }
    public string Level { get; set; } = "high";
    public string Message { get; set; } = string.Empty;
    public bool IsResolved { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
