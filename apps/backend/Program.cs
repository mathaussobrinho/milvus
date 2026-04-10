using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using VisoHelp.Api.Data;
using VisoHelp.Api.Domain;
using VisoHelp.Api.Endpoints;
using VisoHelp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.SerializerOptions.PropertyNameCaseInsensitive = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("local-dev", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8081")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<VisoHelpDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Postgres");
    options.UseNpgsql(connectionString);
});

builder.Services.AddSingleton<JwtTokenIssuer>();
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? "";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("local-dev");
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = "VisoHelp.Api",
    timestamp = DateTimeOffset.UtcNow
}));

app.MapV1Endpoints();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VisoHelpDbContext>();
    var bootLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("MasterAnalyst");

    if (app.Environment.IsDevelopment())
        await db.Database.MigrateAsync();

    await MasterAnalystBootstrap.EnsureMasterAnalystAsync(db, app.Configuration, bootLogger);
    await ClientPublicCodeHelper.BackfillMissingCodesAsync(db);

    if (app.Environment.IsDevelopment() && !await db.Devices.AnyAsync())
    {
        var demoDevice = new Device
        {
            AgentKey = "demo-seed-device",
            TenantId = "default",
            ClientName = "Cliente Demo",
            Hostname = "DEMO-WIN-01",
            OperatingSystem = "Microsoft Windows 11",
            Username = "usuario.demo",
            IpAddress = "192.168.1.10",
            MacAddress = "00:1A:2B:3C:4D:01",
            IsOnline = true,
            LastSeenAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Devices.Add(demoDevice);
        db.Tickets.AddRange(
            new Ticket
            {
                TenantId = "default",
                Title = "Impressora offline na recepcao",
                Status = "open",
                Priority = "high",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            },
            new Ticket
            {
                TenantId = "default",
                Title = "VPN lenta para home office",
                Status = "in_progress",
                Priority = "medium",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        await db.SaveChangesAsync();

        db.DeviceAlerts.Add(new DeviceAlert
        {
            DeviceId = demoDevice.Id,
            Level = "high",
            Message = "Uso de disco acima de 85%",
            IsResolved = false,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();
    }
}

app.Run();
