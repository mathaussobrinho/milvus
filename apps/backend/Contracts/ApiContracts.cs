namespace VisoHelp.Api.Contracts;

public record TicketListItemDto(
    Guid Id,
    string Title,
    string? Description,
    string Status,
    string Priority,
    Guid? ClientId,
    string? ClientName,
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
    Guid? DeviceId);

public record DeviceListItemDto(
    Guid Id,
    string ClientName,
    string Hostname,
    string IpAddress,
    string MacAddress,
    string Username,
    string OperatingSystem,
    bool IsOnline,
    int OpenAlertCount,
    int OpenTicketCount,
    DateTimeOffset LastSeenAt);

public record AgentSyncRequest(
    string AgentKey,
    string Hostname,
    string Username,
    string OperatingSystem,
    string IpAddress,
    string? MacAddress,
    string? ClientName);

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
    IReadOnlyList<TicketListItemDto> Tickets);

public record CreateClientRequest(string Name, string? Email, string? Phone);

public record PatchClientRequest(string? Name, string? Email, string? Phone);

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
    Guid? DeviceId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<TicketCommentItemDto> Comments);

public record CreateTicketCommentRequest(string Body, bool IsInternalOnly);
