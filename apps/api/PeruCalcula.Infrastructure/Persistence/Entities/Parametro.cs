namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class Parametro
{
    public int      Id                { get; set; }
    public string   Clave             { get; set; } = default!;
    public string   Descripcion       { get; set; } = default!;
    public string   Tipo              { get; set; } = "Decimal";
    public string   Valor             { get; set; } = default!;
    public string?  Moneda            { get; set; }
    public string   Fuente            { get; set; } = default!;
    public DateOnly VigenciaDesde     { get; set; }
    public DateOnly? VigenciaHasta    { get; set; }
    public uint     Xmin              { get; set; }   // optimistic concurrency (PostgreSQL)
}
