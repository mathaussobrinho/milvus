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
        pub.MapGet("/public/client-by-code", ClientByCodeAsync);
        pub.MapGet("/public/requester-profile", PublicRequesterProfileAsync);
        pub.MapPost("/public/tickets", PublicCreateTicketAsync);
        pub.MapGet("/public/my-tickets", PublicMyTicketsAsync);
        pub.MapGet("/public/tickets/{id:guid}", PublicTicketDetailForClientAsync);
        pub.MapPost("/public/tickets/{id:guid}/comments", PublicTicketCommentFromClientAsync);
        pub.MapPost("/agent/sync", AgentSyncAsync);
    }

    private static string NormalizePublicCode(string? code) =>
        string.IsNullOrWhiteSpace(code) ? "" : code.Trim().ToUpperInvariant();

    private static string NormalizeEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? "" : email.Trim().ToLowerInvariant();

    /// <summary>Compara MACs ignorando separadores e caixa.</summary>
    private static string NormalizeMacForCompare(string? mac)
    {
        if (string.IsNullOrWhiteSpace(mac))
            return "";
        return new string(mac.Trim().Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
    }

    private static async Task<IResult> PublicRequesterProfileAsync(
        string? code,
        string? agentKey,
        VisoHelpDbContext db)
    {
        var normalized = NormalizePublicCode(code);
        var key = agentKey?.Trim() ?? "";
        if (normalized.Length == 0)
            return Results.BadRequest(new { error = "Codigo obrigatorio." });
        if (key.Length == 0)
            return Results.BadRequest(new { error = "AgentKey obrigatorio." });

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == "default" && c.PublicCode == normalized);
        if (client is null)
            return Results.BadRequest(new { error = "Codigo invalido." });

        var device = await db.Devices.AsNoTracking()
            .FirstOrDefaultAsync(d => d.AgentKey == key && d.ClientId == client.Id);
        if (device is null)
            return Results.BadRequest(new { error = "Agente invalido ou nao pertence a este cliente." });

        var ticket = await db.Tickets.AsNoTracking()
            .Where(t => t.ClientId == client.Id && t.DeviceId == device.Id)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (ticket is null ||
            string.IsNullOrWhiteSpace(ticket.RequesterEmail) ||
            string.IsNullOrWhiteSpace(ticket.RequesterName))
            return Results.NotFound();

        return Results.Ok(new PublicRequesterProfileDto(
            ticket.RequesterName.Trim(),
            ticket.RequesterEmail.Trim(),
            string.IsNullOrWhiteSpace(ticket.RequesterPhone) ? null : ticket.RequesterPhone.Trim(),
            string.IsNullOrWhiteSpace(ticket.RequesterDepartment) ? null : ticket.RequesterDepartment.Trim(),
            string.IsNullOrWhiteSpace(ticket.RequesterRole) ? null : ticket.RequesterRole.Trim()));
    }

    private static async Task<IResult> ClientByCodeAsync(string? code, VisoHelpDbContext db)
    {
        var normalized = NormalizePublicCode(code);
        if (normalized.Length == 0)
            return Results.BadRequest(new { error = "Codigo obrigatorio." });

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == "default" && c.PublicCode == normalized);
        if (client is null)
            return Results.NotFound();

        return Results.Ok(new PublicClientByCodeDto(client.Id, client.Name, client.PublicCode ?? ""));
    }

    private static async Task<IResult> PublicCreateTicketAsync(PublicCreateTicketRequest body, VisoHelpDbContext db)
    {
        var normalized = NormalizePublicCode(body.PublicCode);
        if (normalized.Length == 0)
            return Results.BadRequest(new { error = "Codigo publico obrigatorio." });
        if (string.IsNullOrWhiteSpace(body.Title))
            return Results.BadRequest(new { error = "Titulo obrigatorio." });
        if (string.IsNullOrWhiteSpace(body.ClientMessage))
            return Results.BadRequest(new { error = "Mensagem com o relato do problema e obrigatoria." });

        var name = body.RequesterName?.Trim() ?? "";
        var email = body.RequesterEmail?.Trim() ?? "";
        if (name.Length == 0)
            return Results.BadRequest(new { error = "Nome do solicitante obrigatorio." });
        if (email.Length == 0 || !email.Contains('@', StringComparison.Ordinal))
            return Results.BadRequest(new { error = "E-mail do solicitante invalido." });

        var client = await db.Clients.FirstOrDefaultAsync(c =>
            c.TenantId == "default" && c.PublicCode == normalized);
        if (client is null)
            return Results.BadRequest(new { error = "Codigo invalido." });

        Guid? deviceId = null;
        var agentKey = body.AgentKey?.Trim();
        if (!string.IsNullOrEmpty(agentKey))
        {
            var dev = await db.Devices.FirstOrDefaultAsync(d => d.AgentKey == agentKey);
            if (dev != null && dev.ClientId == client.Id)
                deviceId = dev.Id;
        }

        var clientMsg = body.ClientMessage!.Trim();
        var phone = string.IsNullOrWhiteSpace(body.RequesterPhone) ? null : body.RequesterPhone.Trim();
        var dept = string.IsNullOrWhiteSpace(body.RequesterDepartment) ? null : body.RequesterDepartment.Trim();
        var role = string.IsNullOrWhiteSpace(body.RequesterRole) ? null : body.RequesterRole.Trim();
        var now = DateTimeOffset.UtcNow;
        var ticket = new Ticket
        {
            TenantId = "default",
            Title = body.Title.Trim(),
            ClientProvidedDescription = clientMsg,
            Description = null,
            Priority = "medium",
            Status = "open",
            ClientId = client.Id,
            DeviceId = deviceId,
            RequesterName = name,
            RequesterEmail = email,
            RequesterPhone = phone,
            RequesterDepartment = dept,
            RequesterRole = role,
            AssigneeAnalystId = null,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Tickets.Add(ticket);
        await UpsertClientEmployeeFromPortalAsync(
            db,
            client.Id,
            client.TenantId,
            name,
            email,
            phone,
            dept,
            role,
            now);
        await db.SaveChangesAsync();
        return Results.Created($"/api/v1/tickets/{ticket.Id}", new { ticket.Id });
    }

    /// <summary>
    /// Lista chamados do portal: por agente (KEY + agentKey → dispositivo) e/ou pelo e-mail do solicitante.
    /// Chamados abertos so no browser (sem DeviceId) aparecem quando se informa o mesmo e-mail.
    /// </summary>
    private static async Task<IResult> PublicMyTicketsAsync(
        string? code,
        string? agentKey,
        string? email,
        VisoHelpDbContext db)
    {
        var normalized = NormalizePublicCode(code);
        var key = agentKey?.Trim() ?? "";
        var emailNorm = NormalizeEmail(email);
        if (normalized.Length == 0)
            return Results.BadRequest(new { error = "Codigo obrigatorio." });

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == "default" && c.PublicCode == normalized);
        if (client is null)
            return Results.BadRequest(new { error = "Codigo invalido." });

        if (key.Length == 0 && (emailNorm.Length == 0 || !emailNorm.Contains('@', StringComparison.Ordinal)))
            return Results.BadRequest(new
            {
                error =
                    "Informe o e-mail do solicitante ou abra esta pagina pelo atalho VisoHelp (codigo do agente na URL)."
            });

        Device? device = null;
        if (key.Length > 0)
        {
            device = await db.Devices.AsNoTracking()
                .FirstOrDefaultAsync(d => d.AgentKey == key && d.ClientId == client.Id);
            if (device is null)
                return Results.BadRequest(new { error = "Agente invalido ou nao pertence a este cliente." });
        }

        IQueryable<Ticket> query = db.Tickets.AsNoTracking().Where(t => t.ClientId == client.Id);

        if (device is not null && emailNorm.Length > 0 && emailNorm.Contains('@', StringComparison.Ordinal))
        {
            var devId = device.Id;
            query = query.Where(t =>
                t.DeviceId == devId ||
                (t.RequesterEmail != null && t.RequesterEmail.ToLower() == emailNorm));
        }
        else if (device is not null)
        {
            query = query.Where(t => t.DeviceId == device.Id);
        }
        else
        {
            query = query.Where(t =>
                t.RequesterEmail != null && t.RequesterEmail.ToLower() == emailNorm);
        }

        var list = await query
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new PublicMyTicketItemDto(t.Id, t.Title, t.Status, t.CreatedAt, t.UpdatedAt))
            .ToListAsync();

        return Results.Ok(list);
    }

    private static async Task<IResult> PublicTicketDetailForClientAsync(
        Guid id,
        string? code,
        string? agentKey,
        string? email,
        VisoHelpDbContext db)
    {
        var normalized = NormalizePublicCode(code);
        var key = agentKey?.Trim() ?? "";
        var emailNorm = NormalizeEmail(email);
        if (normalized.Length == 0)
            return Results.BadRequest(new { error = "Codigo obrigatorio." });

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == "default" && c.PublicCode == normalized);
        if (client is null)
            return Results.BadRequest(new { error = "Codigo invalido." });

        Device? device = null;
        if (key.Length > 0)
        {
            device = await db.Devices.AsNoTracking()
                .FirstOrDefaultAsync(d => d.AgentKey == key && d.ClientId == client.Id);
            if (device is null)
                return Results.BadRequest(new { error = "Agente invalido ou nao pertence a este cliente." });
        }

        if (device is null && (emailNorm.Length == 0 || !emailNorm.Contains('@', StringComparison.Ordinal)))
            return Results.BadRequest(new
            {
                error = "Informe o codigo do agente (atalho VisoHelp) ou e-mail do solicitante."
            });

        Ticket? ticket = null;
        if (device is not null)
        {
            ticket = await db.Tickets.AsNoTracking()
                .FirstOrDefaultAsync(t =>
                    t.Id == id && t.ClientId == client.Id && t.DeviceId == device.Id);
        }

        if (ticket is null && emailNorm.Length > 0 && emailNorm.Contains('@', StringComparison.Ordinal))
        {
            ticket = await db.Tickets.AsNoTracking()
                .FirstOrDefaultAsync(t =>
                    t.Id == id &&
                    t.ClientId == client.Id &&
                    t.RequesterEmail != null &&
                    t.RequesterEmail.ToLower() == emailNorm);
        }

        if (ticket is null)
            return Results.NotFound();

        var comments = await db.TicketComments.AsNoTracking()
            .Where(c => c.TicketId == id && !c.IsInternalOnly)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new PublicTicketCommentForClientDto(
                c.Id,
                c.Body,
                c.IsFromClient,
                c.AuthorName,
                c.CreatedAt))
            .ToListAsync();

        return Results.Ok(new PublicTicketDetailForClientDto(
            ticket.Id,
            ticket.Title,
            ticket.ClientProvidedDescription,
            ticket.Status,
            ticket.Priority,
            ticket.RequesterName,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            comments));
    }

    private static async Task<IResult> PublicTicketCommentFromClientAsync(
        Guid id,
        PublicTicketCommentCreateRequest body,
        VisoHelpDbContext db)
    {
        var normalized = NormalizePublicCode(body.PublicCode);
        var key = body.AgentKey?.Trim() ?? "";
        var emailNorm = NormalizeEmail(body.RequesterEmail);
        if (normalized.Length == 0)
            return Results.BadRequest(new { error = "Codigo publico obrigatorio." });
        var text = body.Body?.Trim() ?? "";
        if (text.Length == 0)
            return Results.BadRequest(new { error = "Mensagem obrigatoria." });

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.TenantId == "default" && c.PublicCode == normalized);
        if (client is null)
            return Results.BadRequest(new { error = "Codigo invalido." });

        Device? device = null;
        if (key.Length > 0)
        {
            device = await db.Devices.AsNoTracking()
                .FirstOrDefaultAsync(d => d.AgentKey == key && d.ClientId == client.Id);
            if (device is null)
                return Results.BadRequest(new { error = "Agente invalido ou nao pertence a este cliente." });
        }

        if (device is null && (emailNorm.Length == 0 || !emailNorm.Contains('@', StringComparison.Ordinal)))
            return Results.BadRequest(new
            {
                error = "Informe o codigo do agente (atalho VisoHelp) ou e-mail do solicitante."
            });

        Ticket? ticket = null;
        if (device is not null)
        {
            ticket = await db.Tickets.FirstOrDefaultAsync(t =>
                t.Id == id && t.ClientId == client.Id && t.DeviceId == device.Id);
        }

        if (ticket is null && emailNorm.Length > 0 && emailNorm.Contains('@', StringComparison.Ordinal))
        {
            ticket = await db.Tickets.FirstOrDefaultAsync(t =>
                t.Id == id &&
                t.ClientId == client.Id &&
                t.RequesterEmail != null &&
                t.RequesterEmail.ToLower() == emailNorm);
        }

        if (ticket is null)
            return Results.NotFound();

        if (TicketStatuses.IsTerminal(ticket.Status))
            return Results.BadRequest(new
            {
                error = "Este chamado esta encerrado e nao aceita mais mensagens."
            });

        var now = DateTimeOffset.UtcNow;
        var author = string.IsNullOrWhiteSpace(ticket.RequesterName)
            ? "Cliente"
            : ticket.RequesterName.Trim();
        var comment = new TicketComment
        {
            TenantId = "default",
            TicketId = id,
            Body = text,
            IsInternalOnly = false,
            AuthorAnalystId = null,
            AuthorName = author,
            IsFromClient = true,
            CreatedAt = now
        };
        db.TicketComments.Add(comment);
        ticket.UpdatedAt = now;
        await db.SaveChangesAsync();

        return Results.Created($"/api/v1/public/tickets/{id}", new { comment.Id });
    }

    private static async Task UpsertClientEmployeeFromPortalAsync(
        VisoHelpDbContext db,
        Guid clientId,
        string tenantId,
        string name,
        string emailRaw,
        string? phone,
        string? department,
        string? role,
        DateTimeOffset now)
    {
        var emailLower = emailRaw.Trim().ToLowerInvariant();
        var existing = await db.ClientEmployees
            .FirstOrDefaultAsync(e =>
                e.ClientId == clientId &&
                e.TenantId == tenantId &&
                e.Email != null &&
                e.Email.Trim().ToLower() == emailLower);

        if (existing is not null)
        {
            existing.Name = name.Trim();
            existing.Phone = phone;
            existing.Department = department;
            existing.Role = role;
            existing.UpdatedAt = now;
            return;
        }

        db.ClientEmployees.Add(new ClientEmployee
        {
            TenantId = tenantId,
            ClientId = clientId,
            Name = name.Trim(),
            Email = emailRaw.Trim(),
            Phone = phone,
            Department = department,
            Role = role,
            IsPrimary = false,
            CreatedAt = now,
            UpdatedAt = now
        });
    }

    private static async Task<IResult> AgentSyncAsync(
        AgentSyncRequest body,
        VisoHelpDbContext db)
    {
        if (string.IsNullOrWhiteSpace(body.AgentKey))
            return Results.BadRequest(new { error = "AgentKey obrigatorio." });
        if (string.IsNullOrWhiteSpace(body.Hostname))
            return Results.BadRequest(new { error = "Hostname obrigatorio." });

        var key = body.AgentKey.Trim();
        var device = await db.Devices.FirstOrDefaultAsync(d => d.AgentKey == key);
        var now = DateTimeOffset.UtcNow;
        var mac = string.IsNullOrWhiteSpace(body.MacAddress) ? "" : body.MacAddress.Trim();
        var macNorm = NormalizeMacForCompare(mac);

        var codeNormalized = NormalizePublicCode(body.ClientPublicCode);
        Client? linkedClient = null;
        if (codeNormalized.Length > 0)
        {
            linkedClient = await db.Clients.FirstOrDefaultAsync(c =>
                c.TenantId == "default" && c.PublicCode == codeNormalized);
            if (linkedClient is null)
                return Results.BadRequest(new { error = "Codigo publico do cliente invalido." });
        }

        var clientLabel = linkedClient != null
            ? linkedClient.Name.Trim()
            : (string.IsNullOrWhiteSpace(body.ClientName) ? "Nao informado" : body.ClientName.Trim());

        if (device is null && linkedClient is not null && macNorm.Length >= 12)
        {
            var sameMac = await db.Devices
                .Where(d => d.ClientId == linkedClient.Id)
                .ToListAsync();
            foreach (var d in sameMac)
            {
                if (NormalizeMacForCompare(d.MacAddress) == macNorm)
                {
                    device = d;
                    break;
                }
            }
        }

        if (device is null)
        {
            device = new Device
            {
                AgentKey = key,
                TenantId = "default",
                ClientId = linkedClient?.Id,
                ClientName = clientLabel,
                Hostname = body.Hostname.Trim(),
                OperatingSystem = string.IsNullOrWhiteSpace(body.OperatingSystem)
                    ? "Desconhecido"
                    : body.OperatingSystem.Trim(),
                Username = string.IsNullOrWhiteSpace(body.Username) ? "" : body.Username.Trim(),
                IpAddress = string.IsNullOrWhiteSpace(body.IpAddress) ? "" : body.IpAddress.Trim(),
                MacAddress = mac,
                IsOnline = true,
                LastSeenAt = now,
                CreatedAt = now,
                TotalRamMb = body.TotalRamMb,
                TotalDiskGb = body.TotalDiskGb,
                AntivirusSummary = string.IsNullOrWhiteSpace(body.AntivirusSummary)
                    ? null
                    : body.AntivirusSummary.Trim(),
                CpuSummary = string.IsNullOrWhiteSpace(body.CpuSummary) ? null : body.CpuSummary.Trim(),
                GpuSummary = string.IsNullOrWhiteSpace(body.GpuSummary) ? null : body.GpuSummary.Trim(),
                LastOsBootAt = body.LastOsBootAt,
                CpuTempC = body.CpuTempC
            };
            db.Devices.Add(device);
        }
        else
        {
            device.AgentKey = key;
            if (linkedClient != null)
            {
                device.ClientId = linkedClient.Id;
                device.ClientName = linkedClient.Name.Trim();
            }
            else
            {
                device.ClientName = clientLabel;
            }

            device.Hostname = body.Hostname.Trim();
            device.OperatingSystem = string.IsNullOrWhiteSpace(body.OperatingSystem)
                ? device.OperatingSystem
                : body.OperatingSystem.Trim();
            device.Username = string.IsNullOrWhiteSpace(body.Username) ? device.Username : body.Username.Trim();
            device.IpAddress = string.IsNullOrWhiteSpace(body.IpAddress) ? device.IpAddress : body.IpAddress.Trim();
            device.MacAddress = string.IsNullOrWhiteSpace(mac) ? device.MacAddress : mac;
            device.IsOnline = true;
            device.LastSeenAt = now;
            if (body.TotalRamMb.HasValue)
                device.TotalRamMb = body.TotalRamMb;
            if (body.TotalDiskGb.HasValue)
                device.TotalDiskGb = body.TotalDiskGb;
            if (!string.IsNullOrWhiteSpace(body.AntivirusSummary))
                device.AntivirusSummary = body.AntivirusSummary.Trim();
            if (!string.IsNullOrWhiteSpace(body.CpuSummary))
                device.CpuSummary = body.CpuSummary.Trim();
            if (!string.IsNullOrWhiteSpace(body.GpuSummary))
                device.GpuSummary = body.GpuSummary.Trim();
            if (body.LastOsBootAt.HasValue)
                device.LastOsBootAt = body.LastOsBootAt;
            if (body.CpuTempC.HasValue)
                device.CpuTempC = body.CpuTempC;
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
