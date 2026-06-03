using PeruCalcula.Domain.Tributario;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Fuente: Art.120 TUO LIR (RER), D.Leg.1269 (RMT). UIT 2026 = S/5,350.
/// </summary>
public class RerRmtGoldenTests
{
    private static readonly ParametrosRer ParamsRer = new(
        TasaPct: 1.5m,
        TopeAnual: new Money(525000m),
        Version: "2026",
        FechaActualizacion: new DateOnly(2017, 1, 1)
    );

    private static readonly ParametrosRmt ParamsRmt = new(
        Uit: new Money(5350m),
        Tramo1UITs: 15m,
        Tramo1Pct: 10m,
        Tramo2Pct: 29.5m,
        PagosCuentaUITs: 300m,
        PagosCuentaPct: 1m,
        Version: "2026",
        FechaActualizacion: new DateOnly(2017, 1, 1)
    );

    [Fact]
    [Trait("Category", "Golden")]
    public void Rer_Impuesto_5000Soles()
    {
        // 1.5% * 5000 = 75
        var r = RerCalculadora.Calcular(new RerInput(new Money(5000m)), ParamsRer);
        Assert.Equal(75m, r.Impuesto.Monto);
        Assert.False(r.SuperaTopeAnual);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Rer_AlertaTopeAnual()
    {
        // S/45,000/mes → S/540,000/año > S/525,000
        var r = RerCalculadora.Calcular(new RerInput(new Money(45000m)), ParamsRer);
        Assert.True(r.SuperaTopeAnual);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Rmt_Tramo1_PagosCuenta_1pct()
    {
        // Ingresos S/5000/mes → proyección S/60,000 ≤ 300 UIT (S/1,605,000) → 1%
        // Pago a cuenta = 1% * 5000 = 50
        // Renta anual = 60,000 ≤ 15 UIT (S/80,250) → impuesto 10% * 60,000 = 6,000
        var r = RmtCalculadora.Calcular(new RmtInput(new Money(5000m)), ParamsRmt);
        Assert.Equal(50m,   r.PagoACuenta.Monto);
        Assert.Equal(6000m, r.ImpuestoAnual.Monto);
        Assert.Equal(0m,    r.ImpuestoTramo2.Monto);
        Assert.Equal(1m,    r.PctPagoACuenta);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Rmt_DosTramos()
    {
        // Ingresos S/30,000/mes → proyección S/360,000
        // 15 UIT = 15 * 5350 = 80,250 → tramo1 = 10% * 80,250 = 8,025
        // Tramo2 = 29.5% * (360,000 - 80,250) = 29.5% * 279,750 = 82,526.25
        var r = RmtCalculadora.Calcular(new RmtInput(new Money(30000m)), ParamsRmt);
        Assert.Equal(8025m,     r.ImpuestoTramo1.Monto);
        Assert.Equal(82526.25m, r.ImpuestoTramo2.Monto);
        Assert.Equal(90551.25m, r.ImpuestoAnual.Monto);
    }
}
