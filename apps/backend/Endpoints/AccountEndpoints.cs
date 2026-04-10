using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Contracts;
using VisoHelp.Api.Data;

namespace VisoHelp.Api.Endpoints;

public static class AccountEndpoints
{
    private const int MaxAvatarChars = 480_000;

    public static void MapAccountEndpoints(this RouteGroupBuilder v1)
    {
        v1.MapGet("/account/profile", GetProfileAsync);
        v1.MapPatch("/account/profile", PatchProfileAsync);
    }

    private static async Task<Results<Ok<ProfileResponse>, UnauthorizedHttpResult>> GetProfileAsync(
        ClaimsPrincipal user,
        VisoHelpDbContext db,
        CancellationToken ct)
    {
        if (!AuthHelper.TryGetAnalystId(user, out var id))
            return TypedResults.Unauthorized();

        var analyst = await db.Analysts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (analyst is null)
            return TypedResults.Unauthorized();

        var groups = await db.AnalystTeams.AsNoTracking()
            .Where(at => at.AnalystId == id)
            .Join(db.Teams.AsNoTracking(), at => at.TeamId, t => t.Id, (at, t) => t.Name)
            .OrderBy(n => n)
            .ToListAsync(ct);

        return TypedResults.Ok(new ProfileResponse(
            analyst.Id,
            analyst.Name,
            analyst.Email,
            analyst.Phone,
            analyst.AvatarDataUrl,
            analyst.IsMaster,
            analyst.MustChangePassword,
            groups));
    }

    private static async Task<Results<NoContent, UnauthorizedHttpResult, BadRequest<object>>> PatchProfileAsync(
        ClaimsPrincipal user,
        PatchProfileRequest body,
        VisoHelpDbContext db,
        CancellationToken ct)
    {
        if (!AuthHelper.TryGetAnalystId(user, out var id))
            return TypedResults.Unauthorized();

        var analyst = await db.Analysts.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (analyst is null)
            return TypedResults.Unauthorized();

        if (!string.IsNullOrWhiteSpace(body.Name))
            analyst.Name = body.Name.Trim();
        if (body.Phone is not null)
            analyst.Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim();

        if (body.AvatarDataUrl is not null)
        {
            var raw = body.AvatarDataUrl.Trim();
            if (raw.Length == 0)
                analyst.AvatarDataUrl = null;
            else
            {
                if (raw.Length > MaxAvatarChars)
                    return TypedResults.BadRequest((object)new { error = "Imagem muito grande. Use uma foto menor." });
                if (!raw.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                    return TypedResults.BadRequest((object)new { error = "Formato de imagem invalido (use data URL de imagem)." });
                analyst.AvatarDataUrl = raw;
            }
        }

        analyst.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }
}
