namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class Banco
{
    public int     Id            { get; set; }
    public string  Nombre        { get; set; } = default!;
    public string  Slug          { get; set; } = default!;
    public string? LogoUrl       { get; set; }
    public string? SitioUrl      { get; set; }
    public string? UrlAfiliado   { get; set; }
    public bool    EsPatrocinado  { get; set; }
    public bool    Activo         { get; set; } = true;
    public int     Orden          { get; set; }

    public ICollection<ProductoFinanciero> Productos { get; set; } = [];
}
