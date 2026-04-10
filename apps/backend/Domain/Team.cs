namespace VisoHelp.Api.Domain;

public class Team
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<AnalystTeam> AnalystTeams { get; set; } = new List<AnalystTeam>();
}
