using System.Security.Claims;

namespace VisoHelp.Api.Endpoints;

public static class AuthHelper
{
    public static bool TryGetAnalystId(ClaimsPrincipal user, out Guid id)
    {
        id = default;
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub is not null && Guid.TryParse(sub, out id);
    }
}
