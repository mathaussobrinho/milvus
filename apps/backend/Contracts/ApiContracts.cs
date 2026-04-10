namespace VisoHelp.Api.Contracts;

public record TicketListItemDto(
    Guid Id,
    string Title,
    string? Description,
    string Status,
    string Priority,
    Guid? ClientId,
    string? ClientName,
    Guid? AssigneeAnalystId,
    string? AssigneeName,
    Guid? DeviceId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record CreateTicketRequest(
    string Title,
    string? ClientMessage,
    string? InternalNotes,
    string Priority,
    Guid? ClientId,
    Guid? DeviceId);

public record PatchTicketRequest(
    string? Status,
    string? Title,
    string? Description,
    bool? UpdateDescription,
    string? Priority,
    Guid? ClientId,
    Guid? DeviceId,
    Guid? AssigneeAnalystId,
    bool? UpdateAssignee);

public record DeviceListItemDto(
    Guid Id,
    Guid? ClientId,
    string ClientName,
    string Hostname,
    string IpAddress,
    string MacAddress,
    string Username,
    string OperatingSystem,
    bool IsOnline,
    int OpenAlertCount,
    int OpenTicketCount,
    DateTimeOffset LastSeenAt,
    long? TotalRamMb,
    int? TotalDiskGb,
    string? AntivirusSummary,
    string? CpuSummary,
    string? GpuSummary,
    DateTimeOffset? LastOsBootAt);

public record DeviceDetailDto(
    Guid Id,
    Guid? ClientId,
    string ClientName,
    string Hostname,
    string IpAddress,
    string MacAddress,
    string Username,
    string OperatingSystem,
    bool IsOnline,
    int OpenAlertCount,
    int OpenTicketCount,
    DateTimeOffset LastSeenAt,
    long? TotalRamMb,
    int? TotalDiskGb,
    string? AntivirusSummary,
    string? CpuSummary,
    string? GpuSummary,
    DateTimeOffset? LastOsBootAt,
    string? Notes,
    string AgentKey,
    DateTimeOffset CreatedAt);

public record PatchDeviceRequest(
    string? ClientName,
    string? Hostname,
    string? Username,
    string? Notes,
    Guid? ClientId,
    bool? ClearClientId);

public record AgentSyncRequest(
    string AgentKey,
    string Hostname,
    string Username,
    string OperatingSystem,
    string IpAddress,
    string? MacAddress,
    string? ClientName,
    string? ClientPublicCode,
    long? TotalRamMb,
    int? TotalDiskGb,
    string? AntivirusSummary,
    string? CpuSummary,
    string? GpuSummary,
    DateTimeOffset? LastOsBootAt);

public record PublicClientByCodeDto(Guid Id, string Name, string PublicCode);

public record PublicCreateTicketRequest(
    string PublicCode,
    string Title,
    string? ClientMessage,
    string? RequesterName,
    string? RequesterEmail,
    string? RequesterPhone,
    string? RequesterDepartment,
    string? AgentKey);

/// <summary>Lista de chamados do portal publico (KEY + agentKey → dispositivo).</summary>
public record PublicMyTicketItemDto(
    Guid Id,
    string Title,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record PublicTicketCommentForClientDto(
    Guid Id,
    string Body,
    bool IsFromClient,
    string AuthorName,
    DateTimeOffset CreatedAt);

public record PublicTicketDetailForClientDto(
    Guid Id,
    string Title,
    string? ClientProvidedDescription,
    string Status,
    string Priority,
    string? RequesterName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<PublicTicketCommentForClientDto> Comments);

/// <summary>Comentario publico: use <see cref="AgentKey"/> (atalho do agente) ou <see cref="RequesterEmail"/> (legado).</summary>
public record PublicTicketCommentCreateRequest(
    string PublicCode,
    string Body,
    string? AgentKey,
    string? RequesterEmail);

public record ClientListItemDto(
    Guid Id,
    string Name,
    string PublicCode,
    string? Email,
    string? Phone,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record ClientDetailDto(
    Guid Id,
    string Name,
    string PublicCode,
    string? Email,
    string? Phone,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<TicketListItemDto> Tickets,
    IReadOnlyList<ClientEmployeeDto> Employees);

public record CreateClientRequest(string Name, string? Email, string? Phone);

public record PatchClientRequest(string? Name, string? Email, string? Phone);

public record ClientEmployeeDto(
    Guid Id,
    string Name,
    string? Department,
    string? Role,
    string? Email,
    string? Phone,
    bool IsPrimary,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record CreateClientEmployeeRequest(
    string Name,
    string? Department,
    string? Role,
    string? Email,
    string? Phone,
    bool? IsPrimary);

public record PatchClientEmployeeRequest(
    string? Name,
    string? Department,
    string? Role,
    string? Email,
    string? Phone,
    bool? IsPrimary);

public record AnalystListItemDto(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    bool IsMaster,
    bool MustChangePassword,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record CreateAnalystRequest(string Name, string Email, string Password, bool? MustChangePasswordOnNextLogin, string? Phone);

public record PatchAnalystRequest(string? Name, string? Email, string? Password, bool? MustChangePassword, string? Phone);

public record LoginRequest(string Email, string Password);

public record MeAnalystDto(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string? AvatarDataUrl,
    bool IsMaster,
    bool MustChangePassword,
    IReadOnlyList<string> Groups);

public record LoginResponse(string AccessToken, int ExpiresIn, MeAnalystDto Analyst);

public record ProfileResponse(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string? AvatarDataUrl,
    bool IsMaster,
    bool MustChangePassword,
    IReadOnlyList<string> Groups);

public record PatchProfileRequest(string? Name, string? Phone, string? AvatarDataUrl);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);

public record TicketCommentItemDto(
    Guid Id,
    string Body,
    bool IsInternalOnly,
    string AuthorName,
    bool IsFromClient,
    Guid? AuthorAnalystId,
    DateTimeOffset CreatedAt);

public record TicketDetailDto(
    Guid Id,
    string Title,
    string? ClientProvidedDescription,
    string? Description,
    string Status,
    string Priority,
    Guid? ClientId,
    string? ClientName,
    Guid? AssigneeAnalystId,
    string? AssigneeName,
    Guid? DeviceId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<TicketCommentItemDto> Comments);

public record CreateTicketCommentRequest(string Body, bool IsInternalOnly);
