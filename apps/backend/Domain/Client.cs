namespace VisoHelp.Api.Domain;

public class Client
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TenantId { get; set; } = "default";
    public string Name { get; set; } = string.Empty;
    /// <summary>Codigo publico de 5 caracteres (letras e numeros), imutavel apos criacao.</summary>
    public string? PublicCode { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
