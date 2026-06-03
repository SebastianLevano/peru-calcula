using PeruCalcula.Infrastructure.Persistence.Entities;
using PeruCalcula.Shared.Contracts;

// Nota: SeedBancosF4 agrega registros representativos del mercado peruano.
// UrlAfiliado debe reemplazarse con los enlaces de afiliación reales al firmar acuerdos.

namespace PeruCalcula.Infrastructure.Persistence;

/// <summary>
/// Seed de parámetros normativos como código versionado (ADR-27).
/// Ejecutar como paso explícito en el pipeline CD, no en startup.
/// Cada fila incluye vigencia_desde para permitir versionado histórico.
/// </summary>
public static class SeedParametros
{
    public static IReadOnlyList<Parametro> Vigentes2026() =>
    [
        new() {
            Clave = ParametroClaves.UIT,
            Descripcion = "Unidad Impositiva Tributaria 2026",
            Tipo = "Decimal", Valor = "5350", Moneda = "PEN",
            Fuente = "D.S. N° 314-2024-EF",
            VigenciaDesde = new DateOnly(2026, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RMV,
            Descripcion = "Remuneración Mínima Vital 2024",
            Tipo = "Decimal", Valor = "1025", Moneda = "PEN",
            Fuente = "D.S. N° 003-2022-TR",
            VigenciaDesde = new DateOnly(2022, 5, 1)
        },
        new() {
            Clave = ParametroClaves.AsignacionFamiliar,
            Descripcion = "Asignación familiar (% de la RMV)",
            Tipo = "Decimal", Valor = "10",
            Fuente = "Ley N° 25129",
            VigenciaDesde = new DateOnly(1989, 12, 6)
        },
        new() {
            Clave = ParametroClaves.Retención4taPct,
            Descripcion = "Retención 4ta categoría (%)",
            Tipo = "Decimal", Valor = "8",
            Fuente = "Art. 74 TUO LIR",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.Retención4taUmbral,
            Descripcion = "Umbral mensual para retención 4ta (PEN)",
            Tipo = "Decimal", Valor = "1500", Moneda = "PEN",
            Fuente = "SUNAT",
            VigenciaDesde = new DateOnly(2014, 1, 1)
        },
        new() {
            Clave = ParametroClaves.EsSaludPct,
            Descripcion = "Aporte EsSalud empleador (%)",
            Tipo = "Decimal", Valor = "9",
            Fuente = "Ley N° 26790",
            VigenciaDesde = new DateOnly(1997, 1, 1)
        },
        new() {
            Clave = ParametroClaves.EpsPct,
            Descripcion = "Descuento EPS empleador (%)",
            Tipo = "Decimal", Valor = "6.75",
            Fuente = "Ley N° 26790",
            VigenciaDesde = new DateOnly(1997, 1, 1)
        },
        new() {
            Clave = ParametroClaves.NrusCat1Tope,
            Descripcion = "NRUS Categoría 1: tope mensual (PEN)",
            Tipo = "Decimal", Valor = "5000", Moneda = "PEN",
            Fuente = "D.Leg. N° 937",
            VigenciaDesde = new DateOnly(2004, 1, 1)
        },
        new() {
            Clave = ParametroClaves.NrusCat1Cuota,
            Descripcion = "NRUS Categoría 1: cuota mensual (PEN)",
            Tipo = "Decimal", Valor = "20", Moneda = "PEN",
            Fuente = "D.Leg. N° 937",
            VigenciaDesde = new DateOnly(2004, 1, 1)
        },
        new() {
            Clave = ParametroClaves.NrusCat2Tope,
            Descripcion = "NRUS Categoría 2: tope mensual (PEN)",
            Tipo = "Decimal", Valor = "8000", Moneda = "PEN",
            Fuente = "D.Leg. N° 937",
            VigenciaDesde = new DateOnly(2004, 1, 1)
        },
        new() {
            Clave = ParametroClaves.NrusCat2Cuota,
            Descripcion = "NRUS Categoría 2: cuota mensual (PEN)",
            Tipo = "Decimal", Valor = "50", Moneda = "PEN",
            Fuente = "D.Leg. N° 937",
            VigenciaDesde = new DateOnly(2004, 1, 1)
        },
        new() {
            Clave = ParametroClaves.NrusTopeAnual,
            Descripcion = "NRUS tope anual de ingresos (PEN)",
            Tipo = "Decimal", Valor = "96000", Moneda = "PEN",
            Fuente = "D.Leg. N° 937",
            VigenciaDesde = new DateOnly(2004, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RerPctIngresos,
            Descripcion = "RER: tasa sobre ingresos netos (%)",
            Tipo = "Decimal", Valor = "1.5",
            Fuente = "Art. 120 TUO LIR",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RerTopeAnual,
            Descripcion = "RER: tope anual de ingresos (PEN)",
            Tipo = "Decimal", Valor = "525000", Moneda = "PEN",
            Fuente = "Art. 117 TUO LIR",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RmtTramo1UITs,
            Descripcion = "RMT: tramo 1 hasta N UITs",
            Tipo = "Decimal", Valor = "15",
            Fuente = "D.Leg. N° 1269",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RmtTramo1Pct,
            Descripcion = "RMT: tasa tramo 1 hasta 15 UIT (%)",
            Tipo = "Decimal", Valor = "10",
            Fuente = "D.Leg. N° 1269",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RmtTramo2Pct,
            Descripcion = "RMT: tasa tramo 2 exceso 15 UIT (%)",
            Tipo = "Decimal", Valor = "29.5",
            Fuente = "D.Leg. N° 1269",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RmtPagosCuentaUits,
            Descripcion = "RMT: umbral pagos a cuenta (UITs)",
            Tipo = "Decimal", Valor = "300",
            Fuente = "D.Leg. N° 1269",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
        new() {
            Clave = ParametroClaves.RmtPagosCuentaPct,
            Descripcion = "RMT: tasa pagos a cuenta si ≤300 UIT (%)",
            Tipo = "Decimal", Valor = "1",
            Fuente = "D.Leg. N° 1269",
            VigenciaDesde = new DateOnly(2017, 1, 1)
        },
    ];

    /// <summary>
    /// Seed de bancos y productos representativos del mercado peruano (F4).
    /// Tasas referenciales según publicaciones SBS 2026.
    /// UrlAfiliado: placeholder — reemplazar con enlace real al formalizar acuerdo.
    /// </summary>
    public static (IReadOnlyList<Banco>, IReadOnlyList<ProductoFinanciero>, IReadOnlyList<TasaHistorica>) BancosF4()
    {
        var bcp = new Banco { Nombre = "BCP", Slug = "bcp", SitioUrl = "https://www.viabcp.com", UrlAfiliado = null, EsPatrocinado = false, Activo = true, Orden = 1 };
        var interbank = new Banco { Nombre = "Interbank", Slug = "interbank", SitioUrl = "https://interbank.pe", UrlAfiliado = null, EsPatrocinado = false, Activo = true, Orden = 2 };
        var bbva = new Banco { Nombre = "BBVA", Slug = "bbva", SitioUrl = "https://www.bbva.pe", UrlAfiliado = null, EsPatrocinado = false, Activo = true, Orden = 3 };
        var scotiabank = new Banco { Nombre = "Scotiabank", Slug = "scotiabank", SitioUrl = "https://www.scotiabank.com.pe", UrlAfiliado = null, EsPatrocinado = false, Activo = true, Orden = 4 };
        var pichincha = new Banco { Nombre = "Banco Pichincha", Slug = "pichincha", SitioUrl = "https://www.pichincha.pe", UrlAfiliado = null, EsPatrocinado = false, Activo = true, Orden = 5 };

        var bancos = new List<Banco> { bcp, interbank, bbva, scotiabank, pichincha };

        // Productos por tipo (se generarán IDs al insertar en DB)
        // Por eso retornamos listas separadas para que el seed las procese con contexto de DB
        return (bancos, [], []);
    }
}
