using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Domain;

namespace VisoHelp.Api.Data;

public static class ClientPublicCodeHelper
{
    private const string Chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static async Task<string> GenerateUniqueAsync(
        VisoHelpDbContext db,
        string tenantId,
        CancellationToken ct = default)
    {
        for (var attempt = 0; attempt < 80; attempt++)
        {
            var code = new string(Enumerable.Range(0, 5)
                .Select(_ => Chars[Random.Shared.Next(Chars.Length)])
                .ToArray());
            var taken = await db.Clients.AnyAsync(
                c => c.TenantId == tenantId && c.PublicCode == code, ct);
            if (!taken)
                return code;
        }

        throw new InvalidOperationException("Nao foi possivel gerar codigo unico para o cliente.");
    }

    public static async Task BackfillMissingCodesAsync(VisoHelpDbContext db, CancellationToken ct = default)
    {
        var need = await db.Clients
            .Where(c => c.PublicCode == null || c.PublicCode == "")
            .ToListAsync(ct);
        foreach (var c in need)
        {
            c.PublicCode = await GenerateUniqueAsync(db, c.TenantId, ct);
            c.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (need.Count > 0)
            await db.SaveChangesAsync(ct);
    }
}
