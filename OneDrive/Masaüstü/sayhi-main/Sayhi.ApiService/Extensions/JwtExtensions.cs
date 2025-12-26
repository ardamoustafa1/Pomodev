using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.IdentityModel.Tokens;

namespace Sayhi.ApiService.Extensions
{
    public static class JwtExtensions
    {
        public static AuthenticationBuilder AddJwt(this AuthenticationBuilder builder,
            ConfigurationManager configuration)
        {
            return builder
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = GetIssuerSigningKey(configuration)
                    };
                });
        }

        public static string GetToken(IConfiguration configuration, string username, Guid userId)
        {
            JwtSecurityTokenHandler tokenHandler = new();

            SecurityToken token = tokenHandler.CreateToken(
                new SecurityTokenDescriptor()
                {
                    Subject = new ClaimsIdentity([
                        new Claim(ClaimTypes.Name, username),
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                        //new Claim(JwtRegisteredClaimNames.Sub, "kullaniciadi"), // Subject (Konu)
                        //new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // JWT ID
                        //new Claim("role", "Admin") // Özel talep örneği
                    ]),
                    Expires = DateTime.UtcNow.AddHours(1),
                    SigningCredentials = new SigningCredentials(
                        GetIssuerSigningKey(configuration),
                        SecurityAlgorithms.HmacSha256Signature)
                });

            return tokenHandler.WriteToken(token);
        }

        public static Guid GetUserId(ClaimsPrincipal user)
        {
            ClaimsIdentity? identity = user.Identity as ClaimsIdentity;

            if (identity == null || !identity.IsAuthenticated)
                throw new UnauthorizedAccessException();

            string? userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null)
                throw new UnauthorizedAccessException();

            return Guid.Parse(userId);
        }

        private static SymmetricSecurityKey GetIssuerSigningKey(IConfiguration configuration) =>
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtSettings:Secret"]!));
    }
}
