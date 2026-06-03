namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class AuditLog
{
    public long   Id          { get; set; }
    public int    AdminUserId { get; set; }
    public string Accion      { get; set; } = default!;
    public string Entidad     { get; set; } = default!;
    public string EntidadId   { get; set; } = default!;
    public string? DatosJson  { get; set; }
    public DateTimeOffset Fecha { get; set; }

    public AdminUser AdminUser { get; set; } = default!;
}
