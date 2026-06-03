namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class AnalyticsRollupDiario
{
    public int    Id               { get; set; }
    public DateOnly Fecha          { get; set; }
    public string   CalculadoraSlug { get; set; } = default!;
    public string   Modulo          { get; set; } = default!;
    public long     Inicios         { get; set; }
    public long     Completados     { get; set; }
    public long     ExportPdf       { get; set; }
    public long     ClicksAfiliado  { get; set; }
}
