using PeruCalcula.Domain.Tributario;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Fuente: D.Leg. 937, SUNAT.
/// </summary>
public class NrusGoldenTests
{
    private static readonly ParametrosNrus Params = new(
        Cat1Tope:  new Money(5000m),
        Cat1Cuota: new Money(20m),
        Cat2Tope:  new Money(8000m),
        Cat2Cuota: new Money(50m),
        TopeAnual: new Money(96000m),
        Version: "2024",
        FechaActualizacion: new DateOnly(2004, 1, 1)
    );

    [Fact]
    [Trait("Category", "Golden")]
    public void Categoria1_Ingresos3000()
    {
        var r = NrusCalculadora.Calcular(new NrusInput(new Money(3000m), new Money(2000m)), Params);
        Assert.Equal(1, r.Categoria);
        Assert.Equal(20m, r.Cuota.Monto);
        Assert.Null(r.Alerta);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Categoria2_Ingresos7000()
    {
        var r = NrusCalculadora.Calcular(new NrusInput(new Money(7000m), new Money(6000m)), Params);
        Assert.Equal(2, r.Categoria);
        Assert.Equal(50m, r.Cuota.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void FueraNrus_Supera8000()
    {
        var r = NrusCalculadora.Calcular(new NrusInput(new Money(10000m), new Money(9000m)), Params);
        Assert.Equal(0, r.Categoria);
        Assert.Equal(0m, r.Cuota.Monto);
        Assert.NotNull(r.Alerta);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void AlertaTopeAnual_Cat1_Proyeccion_Supera96k()
    {
        // S/4500 * 12 = 54000 ≤ 96000 → no alerta (límite no superado)
        var r = NrusCalculadora.Calcular(new NrusInput(new Money(4500m), new Money(3000m)), Params);
        Assert.Equal(1, r.Categoria);
        Assert.Null(r.Alerta);

        // S/8500 fuera de NRUS
        var r2 = NrusCalculadora.Calcular(new NrusInput(new Money(8500m), new Money(3000m)), Params);
        Assert.Equal(0, r2.Categoria);
    }
}
