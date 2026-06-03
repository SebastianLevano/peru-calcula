namespace PeruCalcula.Infrastructure.Persistence.Entities;

public sealed class Guia
{
    public int       Id                      { get; set; }
    public string    Slug                    { get; set; } = default!;
    public string    Titulo                  { get; set; } = default!;
    public string    Resumen                 { get; set; } = default!;
    public string    CuerpoMarkdown          { get; set; } = default!;  // sanitizado, nunca HTML crudo
    public string?   CalculadoraRelacionada  { get; set; }
    public string?   MetaTitle               { get; set; }
    public string?   MetaDescription         { get; set; }
    public string    Estado                  { get; set; } = "borrador"; // borrador|publicado
    public DateTimeOffset? PublicadoEn       { get; set; }
    public DateTimeOffset  ActualizadoEn     { get; set; }
    public NpgsqlTypes.NpgsqlTsVector?       SearchVector { get; set; } // FTS (ADR-37)
}
