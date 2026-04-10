namespace VisoHelp.Api.Domain;

public class TicketComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    public Guid TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
    /// <summary>Se true, visivel apenas para analistas. Se false, tambem para o cliente.</summary>
    public bool IsInternalOnly { get; set; }
    public Guid? AuthorAnalystId { get; set; }
    public Analyst? AuthorAnalyst { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public bool IsFromClient { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
