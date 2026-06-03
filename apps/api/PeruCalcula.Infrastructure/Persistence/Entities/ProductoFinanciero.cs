namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class ProductoFinanciero
{
    public int    Id       { get; set; }
    public int    BancoId  { get; set; }
    public string Tipo     { get; set; } = default!;  // personal|vehicular|hipotecario
    public string Nombre   { get; set; } = default!;
    public string Moneda   { get; set; } = "PEN";
    public bool   Activo   { get; set; } = true;

    public Banco              Banco  { get; set; } = default!;
    public ICollection<TasaHistorica> Tasas { get; set; } = [];
}
