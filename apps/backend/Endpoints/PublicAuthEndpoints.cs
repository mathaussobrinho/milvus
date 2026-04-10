using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Contracts;
using VisoHelp.Api.Data;
using VisoHelp.Api.Domain;
using VisoHelp.Api.Services;

namespace VisoHelp.Api.Endpoints;

public static class PublicAuthEndpoints
{
    public static void MapPublicV1Endpoints(this RouteGroupBuilder pub, IHostEnvironment env)
    {
        pub.MapPost("/auth/login", LoginAsync);
        pub.MapPost("/auth/forgot-password", ForgotPasswordAsync);
        pub.MapPost("/auth/reset-password", ResetPasswordAsync);
        pub.MapPost("/agent/sync", AgentSyncAsync);
    }

    private static async Task<IResult> AgentSyncAsync(AgentSyncRequest body, VisoHelpDbContext db)
    {
        if (string.IsNullOrWhiteSpace(body.AgentKey))
            return Results.BadRequest(new { error = "AgentKey obrigatorio." });
        if (string.IsNullOrWhiteSpace(body.Hostname))
            return Results.BadRequest(new { error = "Hostname obrigatorio." });

        var key = body.AgentKey.Trim();
        var device = await db.Devices.FirstOrDefaultAsync(d => d.AgentKey == key);
        var now = DateTimeOffset.UtcNow;
        var mac = string.IsNullOrWhiteSpace(body.MacAddress) ? "" : body.MacAddress.Trim();
        var client = string.IsNullOrWhiteSpace(body.ClientName) ? "Nao informado" : body.ClientName.Trim();

        if (device is null)
        {
            device = new Device
            {
                AgentKey = key,
                TenantId = "default",
                ClientName = client,
                Hostname = body.Hostname.Trim(),
                OperatingSystem = string.IsNullOrWhiteSpace(body.OperatingSystem)
                    ? "Desconhecido"
                    : body.OperatingSystem.Trim(),
                Username = string.IsNullOrWhiteSpace(body.Username) ? "" : body.Username.Trim(),
                IpAddress = string.IsNullOrWhiteSpace(body.IpAddress) ? "" : body.IpAddress.Trim(),
                MacAddress = mac,
                IsOnline = true,
                LastSeenAt = now,
                CreatedAt = now
            };
            db.Devices.Add(device);
        }
        else
        {
            device.ClientName = client;
            device.Hostname = body.Hostname.Trim();
            device.OperatingSystem = string.IsNullOrWhiteSpace(body.OperatingSystem)
                ? device.OperatingSystem
                : body.OperatingSystem.Trim();
            device.Username = string.IsNullOrWhiteSpace(body.Username) ? device.Username : body.Username.Trim();
            device.IpAddress = string.IsNullOrWhiteSpace(body.IpAddress) ? device.IpAddress : body.IpAddress.Trim();
            device.MacAddress = string.IsNullOrWhiteSpace(mac) ? device.MacAddress : mac;
            device.IsOnline = true;
            device.LastSeenAt = now;
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { device.Id, syncedAt = now });
    }

    private static async Task<Results<Ok<LoginResponse>, UnauthorizedHttpResult, BadRequest<object>>> LoginAsync(
        LoginRequest body,
        VisoHelpDbContext db,
        JwtTokenIssuer jwt,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return TypedResults.BadRequest((object)new { error = "E-mail e senha obrigatorios." });

        var email = body.Email.Trim().ToLowerInvariant();
        var analyst = await db.Analysts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.TenantId == "default" && a.Email.ToLower() == email, ct);

        if (analyst is null || !BCrypt.Net.BCrypt.Verify(body.Password.Trim(), analyst.PasswordHash))
            return TypedResults.Unauthorized();

        var now = DateTimeOffset.UtcNow;
        await db.Analysts.Where(a => a.Id == analyst.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.LastLoginAt, now), ct);

        var token = jwt.CreateAccessToken(analyst, out var expiresIn);
        var groups = await db.AnalystTeams.AsNoTracking()
            .Where(at => at.AnalystId == analyst.Id)
            .Join(db.Teams.AsNoTracking(), at => at.TeamId, t => t.Id, (at, t) => t.Name)
            .OrderBy(n => n)
            .ToListAsync(ct);

        var me = new MeAnalystDto(
            analyst.Id,
            analyst.Name,
            analyst.Email,
            analyst.Phone,
            analyst.AvatarDataUrl,
            analyst.IsMaster,
            analyst.MustChangePassword,
            groups);

        return TypedResults.Ok(new LoginResponse(token, expiresIn, me));
    }

    private static async Task<Results<Ok<object>, BadRequest<object>>> ForgotPasswordAsync(
        ForgotPasswordRequest body,
        VisoHelpDbContext db,
        IHostEnvironment env,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Email))
            return TypedResults.BadRequest((object)new { error = "E-mail obrigatorio." });

        var email = body.Email.Trim().ToLowerInvariant();
        var analyst = await db.Analysts
            .FirstOrDefaultAsync(a => a.TenantId == "default" && a.Email.ToLower() == email, ct);

        var message = "Se o e-mail estiver cadastrado, voce podera redefinir a senha com o link enviado.";
        if (analyst is null)
            return TypedResults.Ok((object)new { message });

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var hash = HashToken(rawToken);

        await db.PasswordResetTokens
            .Where(t => t.AnalystId == analyst.Id)
            .ExecuteDeleteAsync(ct);

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            AnalystId = analyst.Id,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(1),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync(ct);

        if (env.IsDevelopment())
            return TypedResults.Ok((object)new { message, devResetToken = rawToken });

        return TypedResults.Ok((object)new { message });
    }

    private static async Task<Results<NoContent, BadRequest<object>>> ResetPasswordAsync(
        ResetPasswordRequest body,
        VisoHelpDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Token) ||
            string.IsNullOrWhiteSpace(body.NewPassword))
            return TypedResults.BadRequest((object)new { error = "E-mail, token e nova senha sao obrigatorios." });

        if (body.NewPassword.Trim().Length < 6)
            return TypedResults.BadRequest((object)new { error = "Senha deve ter pelo menos 6 caracteres." });

        var email = body.Email.Trim().ToLowerInvariant();
        var analyst = await db.Analysts
            .FirstOrDefaultAsync(a => a.TenantId == "default" && a.Email.ToLower() == email, ct);
        if (analyst is null)
            return TypedResults.BadRequest((object)new { error = "Token invalido ou expirado." });

        var hash = HashToken(body.Token.Trim());
        var tokenRow = await db.PasswordResetTokens
            .Where(t => t.AnalystId == analyst.Id && t.TokenHash == hash && t.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (tokenRow is null)
            return TypedResults.BadRequest((object)new { error = "Token invalido ou expirado." });

        analyst.PasswordHash = BCrypt.Net.BCrypt.HashPassword(body.NewPassword.Trim());
        analyst.MustChangePassword = false;
        analyst.UpdatedAt = DateTimeOffset.UtcNow;
        db.PasswordResetTokens.Remove(tokenRow);
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
