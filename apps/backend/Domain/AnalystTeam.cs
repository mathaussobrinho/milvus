namespace VisoHelp.Api.Domain;

public class AnalystTeam
{
    public Guid AnalystId { get; set; }
    public Analyst Analyst { get; set; } = null!;
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;
}
