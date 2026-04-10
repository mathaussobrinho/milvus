namespace VisoHelp.Api.Domain;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    public string Title { get; set; } = string.Empty;
    /// <summary>Relato do solicitante / cliente; nao pode ser alterado via API.</summary>
    public string? ClientProvidedDescription { get; set; }
    /// <summary>Notas e descricao editavel pela equipe interna.</summary>
    public string? Description { get; set; }
    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }
    public Guid? DeviceId { get; set; }
    public string Status { get; set; } = "open";
    public string Priority { get; set; } = "medium";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
