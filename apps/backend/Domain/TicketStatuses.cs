namespace VisoHelp.Api.Domain;

public static class TicketStatuses
{
    public static bool IsTerminal(string? status)
    {
        var s = status?.Trim().ToLowerInvariant() ?? "";
        return s is "resolved" or "closed";
    }
}
