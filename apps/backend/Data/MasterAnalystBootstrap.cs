using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Domain;

namespace VisoHelp.Api.Data;

public static class MasterAnalystBootstrap
{
    public static async Task EnsureMasterAnalystAsync(
        VisoHelpDbContext db,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct = default)
    {
        var section = configuration.GetSection("MasterAnalyst");
        var emailRaw = section["Email"]?.Trim() ?? "";
        var emailNorm = emailRaw.ToLowerInvariant();
        var password = section["Password"]?.Trim();
        var displayName = section["DisplayName"]?.Trim();
        var teamName = section["DefaultTeamName"]?.Trim() ?? "Administradores";

        if (string.IsNullOrEmpty(emailNorm) || string.IsNullOrEmpty(password))
        {
            logger.LogInformation("MasterAnalyst nao configurado (email/senha vazios); seed ignorado.");
            return;
        }

        var analyst = await db.Analysts
            .Include(a => a.AnalystTeams)
            .FirstOrDefaultAsync(a => a.Email.ToLower() == emailNorm, ct);

        var now = DateTimeOffset.UtcNow;
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        if (analyst is null)
        {
            analyst = new Analyst
            {
                TenantId = "default",
                Name = string.IsNullOrEmpty(displayName) ? "Master" : displayName,
                Email = string.IsNullOrEmpty(emailRaw) ? emailNorm : emailRaw,
                Phone = null,
                PasswordHash = hash,
                MustChangePassword = false,
                IsMaster = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.Analysts.Add(analyst);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Usuario master criado: {Email}", analyst.Email);
        }
        else
        {
            var changed = false;
            if (!analyst.IsMaster)
            {
                analyst.IsMaster = true;
                changed = true;
            }

            if (!string.IsNullOrEmpty(displayName) && analyst.Name != displayName)
            {
                analyst.Name = displayName;
                changed = true;
            }

            if (section.GetValue<bool>("ForcePasswordReset"))
            {
                analyst.PasswordHash = hash;
                changed = true;
                logger.LogWarning("MasterAnalyst: senha redefinida por ForcePasswordReset.");
            }

            if (changed)
            {
                analyst.UpdatedAt = now;
                await db.SaveChangesAsync(ct);
            }
        }

        var team = await db.Teams.FirstOrDefaultAsync(
            t => t.TenantId == "default" && t.Name == teamName, ct);
        if (team is null)
        {
            team = new Team
            {
                TenantId = "default",
                Name = teamName,
                CreatedAt = now
            };
            db.Teams.Add(team);
            await db.SaveChangesAsync(ct);
        }

        analyst = await db.Analysts.Include(a => a.AnalystTeams)
            .FirstAsync(a => a.Email.ToLower() == emailNorm, ct);
        if (analyst.AnalystTeams.All(x => x.TeamId != team.Id))
        {
            db.AnalystTeams.Add(new AnalystTeam { AnalystId = analyst.Id, TeamId = team.Id });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Master vinculado ao grupo {Team}", teamName);
        }
    }
}
