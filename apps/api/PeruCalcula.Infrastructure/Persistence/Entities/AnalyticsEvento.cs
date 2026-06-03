namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class AnalyticsEvento
{
    public long          Id                  { get; set; }
    public string        TipoEvento          { get; set; } = default!;  // inicio|completado|export_pdf|click_afiliado
    public string        CalculadoraSlug     { get; set; } = default!;
    public string        Modulo              { get; set; } = default!;  // laboral|tributario|finanzas
    public DateTimeOffset FechaUtc           { get; set; }
    public string        Dispositivo         { get; set; } = default!;  // mobile|desktop|tablet (nunca UA crudo)
    public string?       ParametrosVersion   { get; set; }
}
