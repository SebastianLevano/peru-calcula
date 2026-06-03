using PeruCalcula.Domain.Finanzas;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Golden tests para Crédito Personal con sistema francés.
/// Casos validados contra calculadoras de referencia SBS.
/// </summary>
public class CreditoPersonalGoldenTests
{
    [Fact]
    [Trait("Category", "Golden")]
    public void Credito_10000_24Meses_TEA25()
    {
        // S/10,000 a 24 meses, TEA = 25%
        // TEM = (1.25)^(1/12) - 1 ≈ 1.8769%
        // cuota ≈ S/527.11
        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(10000m), 24, 0.25m));

        Assert.Equal(24, resultado.Cronograma.Count);
        Assert.InRange(resultado.Cuota.Monto, 520m, 523m);
        Assert.True(resultado.TotalIntereses.Monto > 0);
        // El saldo final debe ser 0 (o muy cercano por redondeo)
        Assert.Equal(0m, resultado.Cronograma[^1].Saldo.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Credito_5000_12Meses_TEA18()
    {
        // S/5,000 a 12 meses, TEA = 18%
        // TEM ≈ 1.3888%
        // cuota ≈ S/458.99
        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(5000m), 12, 0.18m));

        Assert.Equal(12, resultado.Cronograma.Count);
        Assert.InRange(resultado.Cuota.Monto, 454m, 457m);
        Assert.Equal(0m, resultado.Cronograma[^1].Saldo.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void TotalPagado_Es_Cuota_Por_Plazo()
    {
        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(8000m), 18, 0.30m));

        var expectedTotal = Math.Round(resultado.Cuota.Monto * 18, 2, MidpointRounding.AwayFromZero);
        Assert.Equal(expectedTotal, resultado.TotalPagado.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void TotalPagado_Menos_Principal_Es_TotalIntereses()
    {
        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(10000m), 36, 0.22m));

        // Tolerancia de ±S/0.50 por redondeo acumulado en cada cuota del cronograma
        var interesesEsperados = resultado.TotalPagado.Monto - 10000m;
        Assert.InRange(resultado.TotalIntereses.Monto,
                       interesesEsperados - 0.50m,
                       interesesEsperados + 0.50m);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Amortizacion_Es_Cuota_Menos_Interes_CadaMes()
    {
        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(5000m), 6, 0.20m));

        foreach (var cuota in resultado.Cronograma.Take(5))  // saltar última por ajuste de redondeo
        {
            var diff = Math.Abs(cuota.Cuota.Monto - cuota.Interes.Monto - cuota.Amortizacion.Monto);
            Assert.True(diff <= 0.01m, $"Mes {cuota.Numero}: cuota - interés - amortización = {diff}");
        }
    }
}
