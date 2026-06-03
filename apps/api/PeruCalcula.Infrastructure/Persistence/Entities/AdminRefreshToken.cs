namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class AdminRefreshToken
{
    public int    Id          { get; set; }
    public int    AdminUserId { get; set; }
    public string TokenHash   { get; set; } = default!;  // nunca el token en claro
    public DateTimeOffset ExpiraEn   { get; set; }
    public DateTimeOffset? RevocadoEn { get; set; }
    public DateTimeOffset  CreadoEn   { get; set; }
    public string?         UserAgent  { get; set; }
    public string?         IpHash     { get; set; }

    public AdminUser AdminUser { get; set; } = default!;

    public bool EstaRevocado => RevocadoEn is not null || DateTimeOffset.UtcNow > ExpiraEn;
}
