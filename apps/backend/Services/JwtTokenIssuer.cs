using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using VisoHelp.Api.Domain;

namespace VisoHelp.Api.Services;

public class JwtTokenIssuer(IConfiguration configuration)
{
    public string CreateAccessToken(Analyst analyst, out int expiresInSeconds)
    {
        var section = configuration.GetSection("Jwt");
        var key = section["Key"] ?? throw new InvalidOperationException("Jwt:Key nao configurada.");
        var issuer = section["Issuer"] ?? "VisoHelp";
        var audience = section["Audience"] ?? "VisoHelp.Web";
        var minutes = int.TryParse(section["ExpiresMinutes"], out var m) ? m : 720;

        if (key.Length < 32)
            throw new InvalidOperationException("Jwt:Key deve ter pelo menos 32 caracteres.");

        expiresInSeconds = minutes * 60;
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, analyst.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, analyst.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, analyst.Name)
        };

        if (analyst.IsMaster)
            claims.Add(new Claim("is_master", "true"));

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(minutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
