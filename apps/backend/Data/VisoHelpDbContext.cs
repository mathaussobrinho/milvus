using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Domain;

namespace VisoHelp.Api.Data;

public class VisoHelpDbContext(DbContextOptions<VisoHelpDbContext> options) : DbContext(options)
{
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<DeviceAlert> DeviceAlerts => Set<DeviceAlert>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Analyst> Analysts => Set<Analyst>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<AnalystTeam> AnalystTeams => Set<AnalystTeam>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<TicketComment> TicketComments => Set<TicketComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Device>(entity =>
        {
            entity.ToTable("devices");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Id).HasColumnName("id");
            entity.Property(d => d.TenantId).HasColumnName("tenant_id").HasMaxLength(100).IsRequired();
            entity.Property(d => d.AgentKey).HasColumnName("agent_key").HasMaxLength(80).IsRequired();
            entity.Property(d => d.ClientName).HasColumnName("client_name").HasMaxLength(200).IsRequired();
            entity.Property(d => d.Hostname).HasColumnName("hostname").HasMaxLength(150).IsRequired();
            entity.Property(d => d.OperatingSystem).HasColumnName("operating_system").HasMaxLength(120).IsRequired();
            entity.Property(d => d.Username).HasColumnName("username").HasMaxLength(120).IsRequired();
            entity.Property(d => d.IpAddress).HasColumnName("ip_address").HasMaxLength(100).IsRequired();
            entity.Property(d => d.MacAddress).HasColumnName("mac_address").HasMaxLength(80).IsRequired();
            entity.Property(d => d.IsOnline).HasColumnName("is_online");
            entity.Property(d => d.LastSeenAt).HasColumnName("last_seen_at");
            entity.Property(d => d.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(d => d.AgentKey).IsUnique();
        });

        modelBuilder.Entity<DeviceAlert>(entity =>
        {
            entity.ToTable("device_alerts");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Id).HasColumnName("id");
            entity.Property(d => d.DeviceId).HasColumnName("device_id");
            entity.Property(d => d.Level).HasColumnName("level").HasMaxLength(20).IsRequired();
            entity.Property(d => d.Message).HasColumnName("message").HasMaxLength(500).IsRequired();
            entity.Property(d => d.IsResolved).HasColumnName("is_resolved");
            entity.Property(d => d.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.ToTable("tickets");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.TenantId).HasColumnName("tenant_id").HasMaxLength(100).IsRequired();
            entity.Property(t => t.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            entity.Property(t => t.ClientProvidedDescription).HasColumnName("client_provided_description")
                .HasMaxLength(4000);
            entity.Property(t => t.Description).HasColumnName("description").HasMaxLength(4000);
            entity.Property(t => t.ClientId).HasColumnName("client_id");
            entity.Property(t => t.DeviceId).HasColumnName("device_id");
            entity.Property(t => t.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            entity.Property(t => t.Priority).HasColumnName("priority").HasMaxLength(30).IsRequired();
            entity.Property(t => t.CreatedAt).HasColumnName("created_at");
            entity.Property(t => t.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(t => t.Client)
                .WithMany()
                .HasForeignKey(t => t.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Device>()
                .WithMany()
                .HasForeignKey(t => t.DeviceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TicketComment>(entity =>
        {
            entity.ToTable("ticket_comments");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.TenantId).HasColumnName("tenant_id").HasMaxLength(100).IsRequired();
            entity.Property(c => c.TicketId).HasColumnName("ticket_id");
            entity.Property(c => c.Body).HasColumnName("body").HasMaxLength(4000).IsRequired();
            entity.Property(c => c.IsInternalOnly).HasColumnName("is_internal_only");
            entity.Property(c => c.AuthorAnalystId).HasColumnName("author_analyst_id");
            entity.Property(c => c.AuthorName).HasColumnName("author_name").HasMaxLength(200).IsRequired();
            entity.Property(c => c.IsFromClient).HasColumnName("is_from_client");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
            entity.HasOne(c => c.Ticket)
                .WithMany()
                .HasForeignKey(c => c.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.AuthorAnalyst)
                .WithMany()
                .HasForeignKey(c => c.AuthorAnalystId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.ToTable("clients");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.TenantId).HasColumnName("tenant_id").HasMaxLength(100).IsRequired();
            entity.Property(c => c.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(c => c.Email).HasColumnName("email").HasMaxLength(200);
            entity.Property(c => c.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(c => c.PublicCode).HasColumnName("public_code").HasMaxLength(5);
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
            entity.Property(c => c.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(c => new { c.TenantId, c.PublicCode })
                .IsUnique()
                .HasFilter("public_code IS NOT NULL");
        });

        modelBuilder.Entity<Analyst>(entity =>
        {
            entity.ToTable("analysts");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id");
            entity.Property(a => a.TenantId).HasColumnName("tenant_id").HasMaxLength(100).IsRequired();
            entity.Property(a => a.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(a => a.Email).HasColumnName("email").HasMaxLength(200).IsRequired();
            entity.Property(a => a.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(a => a.AvatarDataUrl).HasColumnName("avatar_data_url");
            entity.Property(a => a.PasswordHash).HasColumnName("password_hash").HasMaxLength(200).IsRequired();
            entity.Property(a => a.MustChangePassword).HasColumnName("must_change_password");
            entity.Property(a => a.IsMaster).HasColumnName("is_master");
            entity.Property(a => a.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(a => a.CreatedAt).HasColumnName("created_at");
            entity.Property(a => a.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(a => new { a.TenantId, a.Email }).IsUnique();
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ToTable("teams");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.TenantId).HasColumnName("tenant_id").HasMaxLength(100).IsRequired();
            entity.Property(t => t.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(t => t.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(t => new { t.TenantId, t.Name }).IsUnique();
        });

        modelBuilder.Entity<AnalystTeam>(entity =>
        {
            entity.ToTable("analyst_teams");
            entity.HasKey(x => new { x.AnalystId, x.TeamId });
            entity.Property(x => x.AnalystId).HasColumnName("analyst_id");
            entity.Property(x => x.TeamId).HasColumnName("team_id");
            entity.HasOne(x => x.Analyst)
                .WithMany(a => a.AnalystTeams)
                .HasForeignKey(x => x.AnalystId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Team)
                .WithMany(t => t.AnalystTeams)
                .HasForeignKey(x => x.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("password_reset_tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.AnalystId).HasColumnName("analyst_id");
            entity.Property(x => x.TokenHash).HasColumnName("token_hash").HasMaxLength(100).IsRequired();
            entity.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(x => x.AnalystId);
            entity.HasOne(x => x.Analyst)
                .WithMany()
                .HasForeignKey(x => x.AnalystId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
