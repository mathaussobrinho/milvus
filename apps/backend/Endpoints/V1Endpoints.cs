using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Contracts;
using VisoHelp.Api.Data;
using VisoHelp.Api.Domain;
using VisoHelp.Api.Services;

namespace VisoHelp.Api.Endpoints;

public static class V1Endpoints
{
    public static void MapV1Endpoints(this WebApplication app)
    {
        var pub = app.MapGroup("/api/v1");
        pub.MapPublicV1Endpoints(app.Environment);

        var v1 = app.MapGroup("/api/v1").RequireAuthorization();
        v1.MapAccountEndpoints();

        v1.MapGet("/dashboard/overview", async (VisoHelpDbContext db) =>
        {
            var devices = await db.Devices.CountAsync();
            var online = await db.Devices.CountAsync(d => d.IsOnline);
            var alerts = await db.DeviceAlerts.CountAsync(d => !d.IsResolved);
            var tickets = await db.Tickets.CountAsync(t => t.Status != "closed");

            return Results.Ok(new
            {
                devices,
                onlineDevices = online,
                activeAlerts = alerts,
                openTickets = tickets
            });
        });

        v1.MapGet("/dashboard/tickets-analytics", async (VisoHelpDbContext db) =>
        {
            var byStatus = await db.Tickets.AsNoTracking()
                .GroupBy(t => t.Status)
                .Select(g => new { key = g.Key, count = g.Count() })
                .ToListAsync();

            var byPriority = await db.Tickets.AsNoTracking()
                .GroupBy(t => t.Priority)
                .Select(g => new { key = g.Key, count = g.Count() })
                .ToListAsync();

            var clientGroups = await db.Tickets.AsNoTracking()
                .GroupBy(t => t.ClientId)
                .Select(g => new { ClientId = g.Key, Count = g.Count() })
                .ToListAsync();

            var ids = clientGroups
                .Where(x => x.ClientId != null)
                .Select(x => x.ClientId!.Value)
                .Distinct()
                .ToList();

            var nameMap = ids.Count == 0
                ? new Dictionary<Guid, string>()
                : await db.Clients.AsNoTracking()
                    .Where(c => ids.Contains(c.Id))
                    .ToDictionaryAsync(c => c.Id, c => c.Name);

            var byClient = clientGroups.Select(x => new
            {
                key = x.ClientId == null
                    ? "Sem cliente"
                    : nameMap.GetValueOrDefault(x.ClientId.Value, "Desconhecido"),
                count = x.Count
            }).ToList();

            var fromUtc = DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(-13), DateTimeKind.Utc);
            var fromOffset = new DateTimeOffset(fromUtc);
            var createdDates = await db.Tickets.AsNoTracking()
                .Where(t => t.CreatedAt >= fromOffset)
                .Select(t => t.CreatedAt)
                .ToListAsync();

            var byDayDict = new Dictionary<string, int>();
            foreach (var d in createdDates)
            {
                var day = d.UtcDateTime.ToString("yyyy-MM-dd");
                byDayDict[day] = byDayDict.GetValueOrDefault(day, 0) + 1;
            }

            var byDay = Enumerable.Range(0, 14)
                .Select(i =>
                {
                    var day = DateTime.UtcNow.Date.AddDays(-13 + i);
                    var key = day.ToString("yyyy-MM-dd");
                    return new { date = key, count = byDayDict.GetValueOrDefault(key, 0) };
                })
                .ToList();

            return Results.Ok(new
            {
                byStatus,
                byPriority,
                byClient,
                byDay
            });
        });

        v1.MapGet("/tickets", async (VisoHelpDbContext db) =>
        {
            var list = await db.Tickets
                .AsNoTracking()
                .OrderByDescending(t => t.UpdatedAt)
                .Select(t => new TicketListItemDto(
                    t.Id,
                    t.Title,
                    t.Description ?? t.ClientProvidedDescription,
                    t.Status,
                    t.Priority,
                    t.ClientId,
                    t.Client != null ? t.Client.Name : null,
                    t.AssigneeAnalystId,
                    t.AssigneeAnalyst != null ? t.AssigneeAnalyst.Name : null,
                    t.DeviceId,
                    t.CreatedAt,
                    t.UpdatedAt))
                .ToListAsync();

            return Results.Ok(list);
        });

        v1.MapGet("/tickets/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var ticket = await db.Tickets.AsNoTracking()
                .Include(t => t.Client)
                .Include(t => t.AssigneeAnalyst)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (ticket is null)
                return Results.NotFound();

            var comments = await db.TicketComments.AsNoTracking()
                .Where(c => c.TicketId == id)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new TicketCommentItemDto(
                    c.Id,
                    c.Body,
                    c.IsInternalOnly,
                    c.AuthorName,
                    c.IsFromClient,
                    c.AuthorAnalystId,
                    c.CreatedAt))
                .ToListAsync();

            return Results.Ok(new TicketDetailDto(
                ticket.Id,
                ticket.Title,
                ticket.ClientProvidedDescription,
                ticket.Description,
                ticket.Status,
                ticket.Priority,
                ticket.ClientId,
                ticket.Client != null ? ticket.Client.Name : null,
                ticket.AssigneeAnalystId,
                ticket.AssigneeAnalyst != null ? ticket.AssigneeAnalyst.Name : null,
                ticket.DeviceId,
                ticket.CreatedAt,
                ticket.UpdatedAt,
                comments));
        });

        v1.MapPost("/tickets/{id:guid}/comments", async (Guid id, CreateTicketCommentRequest body, ClaimsPrincipal user, VisoHelpDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(body.Body))
                return Results.BadRequest(new { error = "Comentario obrigatorio." });
            if (!AuthHelper.TryGetAnalystId(user, out var analystId))
                return Results.Unauthorized();

            var analyst = await db.Analysts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == analystId);
            if (analyst is null)
                return Results.Unauthorized();

            var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket is null)
                return Results.NotFound();

            if (TicketStatuses.IsTerminal(ticket.Status))
                return Results.BadRequest(new
                {
                    error = "Chamado encerrado; nao e possivel adicionar comentarios."
                });

            var now = DateTimeOffset.UtcNow;
            var comment = new TicketComment
            {
                TenantId = "default",
                TicketId = id,
                Body = body.Body.Trim(),
                IsInternalOnly = body.IsInternalOnly,
                AuthorAnalystId = analyst.Id,
                AuthorName = analyst.Name.Trim(),
                IsFromClient = false,
                CreatedAt = now
            };
            db.TicketComments.Add(comment);
            ticket.UpdatedAt = now;
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/tickets/{id}/comments/{comment.Id}", new { comment.Id });
        });

        v1.MapPost("/tickets", async (CreateTicketRequest body, VisoHelpDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(body.Title))
                return Results.BadRequest(new { error = "Titulo obrigatorio." });
            if (body.ClientId is null || body.ClientId == Guid.Empty)
                return Results.BadRequest(new { error = "Solicitante (cliente) obrigatorio." });

            var clientOk = await db.Clients.AnyAsync(c => c.Id == body.ClientId.Value);
            if (!clientOk)
                return Results.BadRequest(new { error = "Cliente invalido." });

            var priority = string.IsNullOrWhiteSpace(body.Priority) ? "medium" : body.Priority.Trim().ToLowerInvariant();
            var allowed = new[] { "low", "medium", "high", "critical" };
            if (!allowed.Contains(priority))
                priority = "medium";

            var clientMsg = string.IsNullOrWhiteSpace(body.ClientMessage)
                ? null
                : body.ClientMessage.Trim();
            var internalNotes = string.IsNullOrWhiteSpace(body.InternalNotes)
                ? null
                : body.InternalNotes.Trim();

            var now = DateTimeOffset.UtcNow;
            var ticket = new Ticket
            {
                TenantId = "default",
                Title = body.Title.Trim(),
                ClientProvidedDescription = clientMsg,
                Description = internalNotes,
                Priority = priority,
                Status = "open",
                ClientId = body.ClientId.Value,
                DeviceId = body.DeviceId,
                CreatedAt = now,
                UpdatedAt = now
            };

            db.Tickets.Add(ticket);
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/tickets/{ticket.Id}", new { ticket.Id });
        });

        v1.MapPatch("/tickets/{id:guid}", async (Guid id, PatchTicketRequest body, VisoHelpDbContext db) =>
        {
            var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket is null)
                return Results.NotFound();

            var previousStatus = ticket.Status;

            if (!string.IsNullOrWhiteSpace(body.Title))
                ticket.Title = body.Title.Trim();

            if (body.UpdateDescription == true)
                ticket.Description = string.IsNullOrWhiteSpace(body.Description)
                    ? null
                    : body.Description.Trim();

            if (!string.IsNullOrWhiteSpace(body.Priority))
            {
                var p = body.Priority.Trim().ToLowerInvariant();
                var allowedP = new[] { "low", "medium", "high", "critical" };
                if (allowedP.Contains(p))
                    ticket.Priority = p;
            }

            if (body.ClientId.HasValue)
            {
                if (body.ClientId.Value == Guid.Empty)
                    return Results.BadRequest(new { error = "Cliente invalido." });
                var clientOk = await db.Clients.AnyAsync(c => c.Id == body.ClientId.Value);
                if (!clientOk)
                    return Results.BadRequest(new { error = "Cliente invalido." });
                ticket.ClientId = body.ClientId.Value;
            }

            if (body.DeviceId.HasValue)
                ticket.DeviceId = body.DeviceId.Value == Guid.Empty ? null : body.DeviceId;

            if (body.UpdateAssignee == true)
            {
                if (!body.AssigneeAnalystId.HasValue || body.AssigneeAnalystId == Guid.Empty)
                {
                    ticket.AssigneeAnalystId = null;
                }
                else
                {
                    var analystOk = await db.Analysts.AnyAsync(a => a.Id == body.AssigneeAnalystId.Value);
                    if (!analystOk)
                        return Results.BadRequest(new { error = "Analista invalido." });
                    ticket.AssigneeAnalystId = body.AssigneeAnalystId;
                }
            }

            if (!string.IsNullOrWhiteSpace(body.Status))
            {
                var s = body.Status.Trim().ToLowerInvariant();
                var allowed = new[] { "open", "in_progress", "waiting", "resolved", "closed" };
                if (allowed.Contains(s))
                {
                    if (TicketStatuses.IsTerminal(previousStatus) && !TicketStatuses.IsTerminal(s))
                        return Results.BadRequest(new
                        {
                            error = "Chamado encerrado nao pode ser reaberto."
                        });

                    if (TicketStatuses.IsTerminal(s) && !TicketStatuses.IsTerminal(previousStatus))
                    {
                        var block = await TicketCloseValidation.GetBlockingReasonAsync(ticket, db);
                        if (block is not null)
                            return Results.BadRequest(new { error = block });
                    }

                    ticket.Status = s;
                }
            }

            ticket.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapDelete("/tickets/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var ticket = await db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket is null)
                return Results.NotFound();
            db.Tickets.Remove(ticket);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapGet("/devices", async (VisoHelpDbContext db) =>
        {
            var devices = await db.Devices.AsNoTracking().ToListAsync();
            var unresolved = await db.DeviceAlerts.AsNoTracking()
                .Where(a => !a.IsResolved)
                .ToListAsync();
            var alertCounts = unresolved
                .GroupBy(a => a.DeviceId)
                .ToDictionary(g => g.Key, g => g.Count());

            var openTickets = await db.Tickets.AsNoTracking()
                .Where(t => t.DeviceId != null && t.Status != "closed")
                .ToListAsync();
            var ticketCounts = openTickets
                .GroupBy(t => t.DeviceId!.Value)
                .ToDictionary(g => g.Key, g => g.Count());

            var offlineThreshold = TimeSpan.FromMinutes(5);
            var now = DateTimeOffset.UtcNow;

            var list = devices.Select(d =>
            {
                var seen = d.LastSeenAt;
                var online = d.IsOnline && (now - seen) <= offlineThreshold;
                return new DeviceListItemDto(
                    d.Id,
                    d.ClientId,
                    d.ClientName,
                    d.Hostname,
                    d.IpAddress,
                    d.MacAddress,
                    d.Username,
                    d.OperatingSystem,
                    online,
                    alertCounts.GetValueOrDefault(d.Id, 0),
                    ticketCounts.GetValueOrDefault(d.Id, 0),
                    d.LastSeenAt,
                    d.TotalRamMb,
                    d.TotalDiskGb,
                    d.AntivirusSummary,
                    d.CpuSummary,
                    d.GpuSummary,
                    d.LastOsBootAt,
                    d.CpuTempC);
            }).OrderBy(d => d.ClientName).ThenBy(d => d.Hostname).ToList();

            return Results.Ok(list);
        });

        v1.MapGet("/devices/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var d = await db.Devices.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (d is null)
                return Results.NotFound();

            var unresolved = await db.DeviceAlerts.AsNoTracking()
                .Where(a => !a.IsResolved && a.DeviceId == id)
                .CountAsync();
            var openTk = await db.Tickets.AsNoTracking()
                .CountAsync(t => t.DeviceId == id && t.Status != "closed");

            var offlineThreshold = TimeSpan.FromMinutes(5);
            var now = DateTimeOffset.UtcNow;
            var online = d.IsOnline && (now - d.LastSeenAt) <= offlineThreshold;

            return Results.Ok(new DeviceDetailDto(
                d.Id,
                d.ClientId,
                d.ClientName,
                d.Hostname,
                d.IpAddress,
                d.MacAddress,
                d.Username,
                d.OperatingSystem,
                online,
                unresolved,
                openTk,
                d.LastSeenAt,
                d.TotalRamMb,
                d.TotalDiskGb,
                d.AntivirusSummary,
                d.CpuSummary,
                d.GpuSummary,
                d.LastOsBootAt,
                d.CpuTempC,
                d.Notes,
                d.AgentKey,
                d.CreatedAt));
        });

        v1.MapDelete("/devices/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var device = await db.Devices.FirstOrDefaultAsync(x => x.Id == id);
            if (device is null)
                return Results.NotFound();

            await db.DeviceAlerts.Where(a => a.DeviceId == id).ExecuteDeleteAsync();
            db.Devices.Remove(device);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapPatch("/devices/{id:guid}", async (Guid id, PatchDeviceRequest body, VisoHelpDbContext db) =>
        {
            var device = await db.Devices.FirstOrDefaultAsync(x => x.Id == id);
            if (device is null)
                return Results.NotFound();

            var clientLocked = device.ClientId.HasValue;
            if (clientLocked)
            {
                if (body.ClearClientId == true || body.ClientId.HasValue)
                    return Results.BadRequest(new
                    {
                        error =
                            "Cliente cadastrado vinculado pelo agente (KEY) nao pode ser alterado aqui.",
                    });
            }
            else
            {
                if (body.ClearClientId == true)
                    device.ClientId = null;
                else if (body.ClientId.HasValue)
                {
                    var ok = await db.Clients.AnyAsync(c => c.Id == body.ClientId.Value);
                    if (!ok)
                        return Results.BadRequest(new { error = "Cliente invalido." });
                    device.ClientId = body.ClientId;
                }
            }

            if (body.ClientName != null)
                device.ClientName = string.IsNullOrWhiteSpace(body.ClientName) ? device.ClientName : body.ClientName.Trim();
            if (body.Hostname != null)
                device.Hostname = string.IsNullOrWhiteSpace(body.Hostname) ? device.Hostname : body.Hostname.Trim();
            if (body.Username != null)
                device.Username = body.Username.Trim();
            if (body.Notes != null)
                device.Notes = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();

            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapGet("/clients", async (VisoHelpDbContext db) =>
        {
            var list = await db.Clients
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new ClientListItemDto(
                    c.Id,
                    c.Name,
                    c.PublicCode ?? "",
                    c.Email,
                    c.Phone,
                    c.CreatedAt,
                    c.UpdatedAt))
                .ToListAsync();

            return Results.Ok(list);
        });

        v1.MapGet("/clients/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var client = await db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
            if (client is null)
                return Results.NotFound();

            var tickets = await db.Tickets
                .AsNoTracking()
                .Where(t => t.ClientId == id)
                .OrderByDescending(t => t.UpdatedAt)
                .Select(t => new TicketListItemDto(
                    t.Id,
                    t.Title,
                    t.Description ?? t.ClientProvidedDescription,
                    t.Status,
                    t.Priority,
                    t.ClientId,
                    t.Client != null ? t.Client.Name : null,
                    t.AssigneeAnalystId,
                    t.AssigneeAnalyst != null ? t.AssigneeAnalyst.Name : null,
                    t.DeviceId,
                    t.CreatedAt,
                    t.UpdatedAt))
                .ToListAsync();

            var employees = await db.ClientEmployees
                .AsNoTracking()
                .Where(e => e.ClientId == id)
                .OrderByDescending(e => e.IsPrimary)
                .ThenBy(e => e.Name)
                .Select(e => new ClientEmployeeDto(
                    e.Id,
                    e.Name,
                    e.Department,
                    e.Role,
                    e.Email,
                    e.Phone,
                    e.IsPrimary,
                    e.CreatedAt,
                    e.UpdatedAt))
                .ToListAsync();

            return Results.Ok(new ClientDetailDto(
                client.Id,
                client.Name,
                client.PublicCode ?? "",
                client.Email,
                client.Phone,
                client.CreatedAt,
                client.UpdatedAt,
                tickets,
                employees));
        });

        v1.MapPost("/clients", async (CreateClientRequest body, VisoHelpDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(body.Name))
                return Results.BadRequest(new { error = "Nome obrigatorio." });

            var now = DateTimeOffset.UtcNow;
            var tenant = "default";
            var code = await ClientPublicCodeHelper.GenerateUniqueAsync(db, tenant);

            var client = new Client
            {
                TenantId = tenant,
                Name = body.Name.Trim(),
                PublicCode = code,
                Email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim(),
                CreatedAt = now,
                UpdatedAt = now
            };

            db.Clients.Add(client);
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/clients/{client.Id}", new { client.Id, publicCode = client.PublicCode });
        });

        v1.MapPatch("/clients/{id:guid}", async (Guid id, PatchClientRequest body, VisoHelpDbContext db) =>
        {
            var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id);
            if (client is null)
                return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(body.Name))
                client.Name = body.Name.Trim();
            if (body.Email is not null)
                client.Email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim();
            if (body.Phone is not null)
                client.Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim();

            client.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapDelete("/clients/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == id);
            if (client is null)
                return Results.NotFound();

            db.Clients.Remove(client);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapPost("/clients/{clientId:guid}/employees", async (Guid clientId, CreateClientEmployeeRequest body, VisoHelpDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(body.Name))
                return Results.BadRequest(new { error = "Nome do funcionario obrigatorio." });

            var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            if (client is null)
                return Results.NotFound(new { error = "Cliente nao encontrado." });

            var now = DateTimeOffset.UtcNow;
            var employee = new ClientEmployee
            {
                TenantId = client.TenantId,
                ClientId = clientId,
                Name = body.Name.Trim(),
                Department = string.IsNullOrWhiteSpace(body.Department) ? null : body.Department.Trim(),
                Role = string.IsNullOrWhiteSpace(body.Role) ? null : body.Role.Trim(),
                Email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim(),
                IsPrimary = body.IsPrimary == true,
                CreatedAt = now,
                UpdatedAt = now
            };

            if (employee.IsPrimary)
            {
                var currentPrimary = await db.ClientEmployees
                    .Where(e => e.ClientId == clientId && e.IsPrimary)
                    .ToListAsync();
                foreach (var item in currentPrimary)
                {
                    item.IsPrimary = false;
                    item.UpdatedAt = now;
                }
            }

            db.ClientEmployees.Add(employee);
            client.UpdatedAt = now;
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/clients/{clientId}/employees/{employee.Id}", new { employee.Id });
        });

        v1.MapPatch("/clients/{clientId:guid}/employees/{employeeId:guid}", async (Guid clientId, Guid employeeId, PatchClientEmployeeRequest body, VisoHelpDbContext db) =>
        {
            var employee = await db.ClientEmployees
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.ClientId == clientId);
            if (employee is null)
                return Results.NotFound(new { error = "Funcionario nao encontrado." });

            if (body.Name is not null)
            {
                if (string.IsNullOrWhiteSpace(body.Name))
                    return Results.BadRequest(new { error = "Nome do funcionario obrigatorio." });
                employee.Name = body.Name.Trim();
            }

            if (body.Department is not null)
                employee.Department = string.IsNullOrWhiteSpace(body.Department) ? null : body.Department.Trim();
            if (body.Role is not null)
                employee.Role = string.IsNullOrWhiteSpace(body.Role) ? null : body.Role.Trim();
            if (body.Email is not null)
                employee.Email = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email.Trim();
            if (body.Phone is not null)
                employee.Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim();

            var now = DateTimeOffset.UtcNow;
            if (body.IsPrimary.HasValue)
            {
                employee.IsPrimary = body.IsPrimary.Value;
                if (employee.IsPrimary)
                {
                    var others = await db.ClientEmployees
                        .Where(e => e.ClientId == clientId && e.Id != employeeId && e.IsPrimary)
                        .ToListAsync();
                    foreach (var other in others)
                    {
                        other.IsPrimary = false;
                        other.UpdatedAt = now;
                    }
                }
            }

            employee.UpdatedAt = now;
            var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            if (client is not null)
                client.UpdatedAt = now;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapDelete("/clients/{clientId:guid}/employees/{employeeId:guid}", async (Guid clientId, Guid employeeId, VisoHelpDbContext db) =>
        {
            var employee = await db.ClientEmployees
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.ClientId == clientId);
            if (employee is null)
                return Results.NotFound();

            db.ClientEmployees.Remove(employee);

            var client = await db.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
            if (client is not null)
                client.UpdatedAt = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapGet("/analysts", async (VisoHelpDbContext db) =>
        {
            var list = await db.Analysts
                .AsNoTracking()
                .OrderBy(a => a.Name)
                .Select(a => new AnalystListItemDto(
                    a.Id,
                    a.Name,
                    a.Email,
                    a.Phone,
                    a.IsMaster,
                    a.MustChangePassword,
                    a.LastLoginAt,
                    a.CreatedAt,
                    a.UpdatedAt))
                .ToListAsync();

            return Results.Ok(list);
        });

        v1.MapPost("/analysts", async (CreateAnalystRequest body, VisoHelpDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(body.Name))
                return Results.BadRequest(new { error = "Nome obrigatorio." });
            if (string.IsNullOrWhiteSpace(body.Email))
                return Results.BadRequest(new { error = "E-mail obrigatorio." });
            if (string.IsNullOrWhiteSpace(body.Password))
                return Results.BadRequest(new { error = "Senha obrigatoria." });

            var email = body.Email.Trim().ToLowerInvariant();
            var exists = await db.Analysts.AnyAsync(a =>
                a.TenantId == "default" && a.Email.ToLower() == email);
            if (exists)
                return Results.BadRequest(new { error = "E-mail ja cadastrado." });

            var now = DateTimeOffset.UtcNow;
            var analyst = new Analyst
            {
                TenantId = "default",
                Name = body.Name.Trim(),
                Email = body.Email.Trim(),
                Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(body.Password.Trim()),
                MustChangePassword = body.MustChangePasswordOnNextLogin == true,
                IsMaster = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            db.Analysts.Add(analyst);
            await db.SaveChangesAsync();

            return Results.Created($"/api/v1/analysts/{analyst.Id}", new { analyst.Id });
        });

        v1.MapPatch("/analysts/{id:guid}", async (Guid id, PatchAnalystRequest body, VisoHelpDbContext db) =>
        {
            var analyst = await db.Analysts.FirstOrDefaultAsync(a => a.Id == id);
            if (analyst is null)
                return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(body.Name))
                analyst.Name = body.Name.Trim();

            if (!string.IsNullOrWhiteSpace(body.Email))
            {
                var email = body.Email.Trim().ToLowerInvariant();
                var taken = await db.Analysts.AnyAsync(a =>
                    a.Id != id && a.TenantId == "default" && a.Email.ToLower() == email);
                if (taken)
                    return Results.BadRequest(new { error = "E-mail ja cadastrado." });
                analyst.Email = body.Email.Trim();
            }

            if (!string.IsNullOrWhiteSpace(body.Password))
            {
                analyst.PasswordHash = BCrypt.Net.BCrypt.HashPassword(body.Password.Trim());
                analyst.MustChangePassword = false;
            }

            if (body.MustChangePassword.HasValue)
                analyst.MustChangePassword = body.MustChangePassword.Value;

            if (body.Phone is not null)
                analyst.Phone = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone.Trim();

            analyst.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        v1.MapDelete("/analysts/{id:guid}", async (Guid id, VisoHelpDbContext db) =>
        {
            var analyst = await db.Analysts.FirstOrDefaultAsync(a => a.Id == id);
            if (analyst is null)
                return Results.NotFound();
            if (analyst.IsMaster)
                return Results.BadRequest(new { error = "Nao e possivel excluir o usuario master." });

            db.Analysts.Remove(analyst);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
