using PeruCalcula.Domain.Laboral;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Golden tests contra casos normativos de la SUNAFIL / D.Leg. 650.
/// Parámetros fijados en la versión de la norma; no cambian aunque cambie la UIT.
/// Fuente: docs/normativa/laboral/cts.md
/// </summary>
public class CtsGoldenTests
{
    // Parámetros fijos para los tests (RMV 2024, AsigFamiliar 10%)
    private static readonly ParametrosCts Params2024 = new(
        Rmv: new Money(1025m),
        AsignacionFamiliarPct: 10m,
        Version: "2024",
        FechaActualizacion: new DateOnly(2022, 5, 1)
    );

    [Fact]
    [Trait("Category", "Golden")]
    public void CasoBásico_SinHijos_4Meses()
    {
        // RC = 2000 (sin asig.familiar) + 2000/6 = 2000 + 333.33 = 2333.33
        // CTS = 2333.33/12 * 4 = 777.78
        var resultado = CtsCalculadora.Calcular(
            new CtsInput(new Money(2000m), TieneHijos: false, MesesCompletados: 4, DiasAdicionales: 0),
            Params2024);

        Assert.Equal(333.33m, resultado.SextaGratificacion.Monto);
        Assert.Equal(777.78m, resultado.MontoFinal.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void CasoConHijos_4Meses15Dias()
    {
        // Asig.familiar = 10% * 1025 = 102.50
        // RC = 3000 + 102.50 + 3000/6 = 3000 + 102.50 + 500 = 3602.50
        // CTS meses = 3602.50/12 * 4 = 1200.83
        // CTS días  = 3602.50/360 * 15 = 150.10
        // Total     = 1350.93
        var resultado = CtsCalculadora.Calcular(
            new CtsInput(new Money(3000m), TieneHijos: true, MesesCompletados: 4, DiasAdicionales: 15),
            Params2024);

        Assert.Equal(102.50m, resultado.AsignacionFamiliar.Monto);
        Assert.Equal(500.00m, resultado.SextaGratificacion.Monto);
        Assert.Equal(3602.50m, resultado.RemuneracionComputable.Monto);
        Assert.Equal(1200.83m, resultado.CtsMeses.Monto);
        Assert.Equal(150.10m, resultado.CtsDias.Monto);
        Assert.Equal(1350.93m, resultado.MontoFinal.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Sueldo_RMV_SinHijos_4Meses()
    {
        // RC = 1025 + 1025/6 = 1025 + 170.83 = 1195.83
        // CTS = 1195.83/12 * 4 = 398.61
        var resultado = CtsCalculadora.Calcular(
            new CtsInput(new Money(1025m), TieneHijos: false, MesesCompletados: 4, DiasAdicionales: 0),
            Params2024);

        Assert.Equal(170.83m, resultado.SextaGratificacion.Monto);
        Assert.Equal(398.61m, resultado.MontoFinal.Monto);
    }
}
