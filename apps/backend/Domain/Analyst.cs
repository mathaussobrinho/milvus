namespace VisoHelp.Api.Domain;

public class Analyst
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    /// <summary>Data URL da foto (ex.: image/jpeg;base64,...), opcional.</summary>
    public string? AvatarDataUrl { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; }
    public bool IsMaster { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<AnalystTeam> AnalystTeams { get; set; } = new List<AnalystTeam>();
}
