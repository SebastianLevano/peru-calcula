using PeruCalcula.Domain.Finanzas;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Golden tests para ComparadorCalculadora.
/// TCEA calculada según metodología SBS (Res. 6523-2013):
///   P = sum_{k=1}^{n} F_k / (1+TCEA)^(k/12)
/// Los valores de referencia fueron calculados con la fórmula y verificados con simuladores SBS.
/// Fuente: docs/normativa/finanzas/comparador.md
/// </summary>
public class ComparadorGoldenTests
{
    // ── Caso 1: crédito sin comisión — TCEA = TEA ─────────────────────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void SinComision_TceaIgualTea()
    {
        // Sin comisión, el flujo mensual = solo la cuota.
        // TCEA debe converger a la misma TEA ingresada.
        var input = new ComparadorInput(Monto: 10_000m, PlazoMeses: 24, Tea: 0.25m, ComisionAdminMensual: 0m);
        var r = ComparadorCalculadora.Calcular(input);

        // La TCEA sin comisiones debe ser igual a la TEA (dentro de ± 0.0001)
        Assert.Equal(0.25m, Math.Round(r.Tcea, 4));
        Assert.Equal(r.Cuota.Monto, r.FlujoMensual.Monto);
        Assert.Equal(0m, r.ComisionMensual.Monto);
    }

    // ── Caso 2: crédito con comisión — TCEA > TEA ────────────────────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void ConComision_TceaMayorQueTea()
    {
        // TEA=25%, comisión S/15/mes — TCEA debe ser mayor que 25%
        var input = new ComparadorInput(Monto: 10_000m, PlazoMeses: 24, Tea: 0.25m, ComisionAdminMensual: 15m);
        var r = ComparadorCalculadora.Calcular(input);

        Assert.True(r.Tcea > r.Tea, "Con comisión la TCEA debe superar la TEA.");
        Assert.Equal(15m, r.ComisionMensual.Monto);
        Assert.Equal(r.FlujoMensual.Monto, r.Cuota.Monto + 15m);
    }

    // ── Caso 3: cuota calculada correctamente (sistema francés) ──────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void CuotaSistemaFrances_P10000_24m_TEA25()
    {
        // TEM = (1.25)^(1/12) - 1 ≈ 0.018769
        // cuota = 10000 * 0.018769 * (1.018769)^24 / ((1.018769)^24 - 1) ≈ 521.37
        var input = new ComparadorInput(Monto: 10_000m, PlazoMeses: 24, Tea: 0.25m, ComisionAdminMensual: 0m);
        var r = ComparadorCalculadora.Calcular(input);

        Assert.Equal(521.37m, r.Cuota.Monto);
    }

    // ── Caso 4: total pagado = flujo mensual * n ──────────────────────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void TotalPagado_EsFlujoMensualPorPlazo()
    {
        var input = new ComparadorInput(Monto: 5_000m, PlazoMeses: 12, Tea: 0.20m, ComisionAdminMensual: 10m);
        var r = ComparadorCalculadora.Calcular(input);

        var esperado = Math.Round(r.FlujoMensual.Monto * 12, 2, MidpointRounding.AwayFromZero);
        Assert.Equal(esperado, r.TotalPagado.Monto);
    }

    // ── Caso 5: cronograma — cantidad de cuotas = plazo ──────────────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void Cronograma_TieneCuotasIgualesAlPlazo()
    {
        var input = new ComparadorInput(Monto: 8_000m, PlazoMeses: 36, Tea: 0.30m, ComisionAdminMensual: 5m);
        var r = ComparadorCalculadora.Calcular(input);

        Assert.Equal(36, r.Cronograma.Count);
        Assert.Equal(0m, r.Cronograma.Last().Saldo.Monto); // saldo final = 0
    }

    // ── Caso 6: TEA = 0 — cuota = monto / plazo ──────────────────────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void Tea0_CuotaEsMontoEntrePlazo()
    {
        var input = new ComparadorInput(Monto: 1_200m, PlazoMeses: 12, Tea: 0m, ComisionAdminMensual: 0m);
        var r = ComparadorCalculadora.Calcular(input);

        Assert.Equal(100m, r.Cuota.Monto);
        Assert.Equal(0m,   r.TotalIntereses.Monto);
    }

    // ── Caso 7: argumentos inválidos ─────────────────────────────────────────
    [Theory]
    [Trait("Category", "Golden")]
    [InlineData(-1, 12, 0.25, 0)]
    [InlineData(1000, 0, 0.25, 0)]
    [InlineData(1000, 12, -0.01, 0)]
    [InlineData(1000, 12, 0.25, -1)]
    public void InputInvalido_LanzaArgumentException(decimal monto, int plazo, decimal tea, decimal comision)
    {
        Assert.Throws<ArgumentException>(() =>
            ComparadorCalculadora.Calcular(new ComparadorInput(monto, plazo, tea, comision)));
    }

    // ── Caso 8: TCEA referencial banco peruano (mercado) ─────────────────────
    [Fact]
    [Trait("Category", "Golden")]
    public void CasoReferencialMercado_TEA45_Comision20()
    {
        // TEA=45%, comisión S/20/mes, monto S/5000, plazo 18 meses
        // TCEA esperada > 45% por efecto de la comisión
        var input = new ComparadorInput(Monto: 5_000m, PlazoMeses: 18, Tea: 0.45m, ComisionAdminMensual: 20m);
        var r = ComparadorCalculadora.Calcular(input);

        Assert.True(r.Tcea > 0.45m);
        Assert.Equal(18, r.Cronograma.Count);
        Assert.Equal(20m * 18, r.TotalComisiones.Monto);
    }
}
