using Microsoft.EntityFrameworkCore;
using VisoHelp.Api.Data;
using VisoHelp.Api.Domain;

namespace VisoHelp.Api.Services;

public static class TicketCloseValidation
{
    /// <summary>
    /// Dispositivo nao e obrigatorio. Exige cliente, responsavel, titulo e pelo menos um comentario.
    /// </summary>
    public static async Task<string?> GetBlockingReasonAsync(
        Ticket ticket,
        VisoHelpDbContext db,
        CancellationToken cancellationToken = default)
    {
        if (ticket.ClientId is null)
            return "Defina o cliente antes de marcar como resolvido ou fechado.";

        if (ticket.AssigneeAnalystId is null)
            return "Defina o analista responsavel antes de marcar como resolvido ou fechado.";

        if (string.IsNullOrWhiteSpace(ticket.Title))
            return "O titulo do chamado e obrigatorio.";

        var hasComment = await db.TicketComments.AsNoTracking()
            .AnyAsync(c => c.TicketId == ticket.Id, cancellationToken);

        if (!hasComment)
            return "Inclua pelo menos um comentario no chamado antes de encerrar.";

        return null;
    }
}
