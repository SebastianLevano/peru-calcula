namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class AdminUser
{
    public int    Id           { get; set; }
    public string Email        { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;  // BCrypt/Argon2
    public string Rol          { get; set; } = "admin";
    public bool   Activo       { get; set; } = true;
    public DateTimeOffset CreadoEn { get; set; }

    public ICollection<AdminRefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<AuditLog>          AuditLogs      { get; set; } = [];
}
