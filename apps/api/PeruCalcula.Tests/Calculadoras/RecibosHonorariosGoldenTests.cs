using PeruCalcula.Domain.Tributario;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Golden tests para Recibos por Honorarios (4ta categoría).
/// Fuente: Art. 74 TUO LIR, SUNAT.
/// Parámetros fijados: tasa 8%, umbral S/1,500, UIT S/5,350 (2026).
/// </summary>
public class RecibosHonorariosGoldenTests
{
    private static readonly ParametrosRecibos Params2026 = new(
        TasaRetencionPct:  8m,
        UmbralMensual:     new Money(1500m),
        Uit:               new Money(5350m),
        Version:           "2026",
        FechaActualizacion: new DateOnly(2026, 1, 1)
    );

    [Fact]
    [Trait("Category", "Golden")]
    public void Recibo_Sobre_Umbral_Aplica_Retencion()
    {
        // S/2,000 > S/1,500 → retención = 8% * 2000 = 160
        var resultado = RecibosHonorariosCalculadora.Calcular(
            new RecibosInput(new Money(2000m)), Params2026);

        Assert.True(resultado.AplicaRetencion);
        Assert.Equal(160m, resultado.MontoRetencion.Monto);
        Assert.Equal(1840m, resultado.MontoNeto.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Recibo_Bajo_Umbral_Sin_Retencion()
    {
        // S/1,200 ≤ S/1,500 → sin retención
        var resultado = RecibosHonorariosCalculadora.Calcular(
            new RecibosInput(new Money(1200m)), Params2026);

        Assert.False(resultado.AplicaRetencion);
        Assert.Equal(0m, resultado.MontoRetencion.Monto);
        Assert.Equal(1200m, resultado.MontoNeto.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Proyeccion_Anual_Bajo_7UIT_Califica_Suspension()
    {
        // 7 UIT = 7 * 5350 = 37,450
        // Recibo mensual S/3,000 → proyección S/36,000 < S/37,450 → califica suspensión
        var resultado = RecibosHonorariosCalculadora.Calcular(
            new RecibosInput(new Money(3000m)), Params2026);

        Assert.True(resultado.CalificaSuspension);
        Assert.Equal(36000m, resultado.ProyeccionAnual.Monto);
        Assert.Equal(37450m, resultado.LimiteExencion.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Proyeccion_Anual_Sobre_7UIT_No_Califica_Suspension()
    {
        // Recibo mensual S/4,000 → proyección S/48,000 > S/37,450 → no califica
        var resultado = RecibosHonorariosCalculadora.Calcular(
            new RecibosInput(new Money(4000m)), Params2026);

        Assert.False(resultado.CalificaSuspension);
    }
}
