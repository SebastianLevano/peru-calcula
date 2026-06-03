namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class TasaHistorica
{
    public int      Id              { get; set; }
    public int      ProductoId      { get; set; }
    public decimal  Tea             { get; set; }
    public decimal  Tcea            { get; set; }
    public decimal? ComisionAdmin   { get; set; }
    public DateOnly VigenciaDesde   { get; set; }
    public DateOnly? VigenciaHasta  { get; set; }
    public string   Fuente          { get; set; } = default!;
    public bool     EsReferencial   { get; set; } = true;
    public uint     Xmin            { get; set; }   // optimistic concurrency

    public ProductoFinanciero Producto { get; set; } = default!;
}
