namespace VisoHelp.Api.Domain;

public class ClientEmployee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    public Guid ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Role { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsPrimary { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Client? Client { get; set; }
}
