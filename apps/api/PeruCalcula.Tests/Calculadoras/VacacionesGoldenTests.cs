using PeruCalcula.Domain.Laboral;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Fuente: D.Leg. 713, D.S. 012-92-TR.
/// </summary>
public class VacacionesGoldenTests
{
    private static readonly ParametrosVacaciones Params = new(
        Rmv: new Money(1025m),
        AsignacionFamiliarPct: 10m,
        Version: "2024",
        FechaActualizacion: new DateOnly(1992, 12, 8)
    );

    [Fact]
    [Trait("Category", "Golden")]
    public void Ordinarias_1Anio_SinHijos()
    {
        // RC = 2500 = 1 mes → ordinarias = 2500
        var r = VacacionesCalculadora.Calcular(
            new VacacionesInput(new Money(2500m), false, 1), Params);

        Assert.Equal(2500m, r.VacacionesOrdinarias.Monto);
        Assert.Equal(0m,    r.VacacionesTruncas.Monto);
        Assert.Equal(2500m, r.Total.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Truncas_8Meses_ConHijos()
    {
        // AsigFam = 102.50; RC = 1500 + 102.50 = 1602.50
        // Truncas = 1602.50/12 * 8 = 1068.33
        var r = VacacionesCalculadora.Calcular(
            new VacacionesInput(new Money(1500m), true, 0, MesesTruncos: 8), Params);

        Assert.Equal(102.50m,  r.AsignacionFamiliar.Monto);
        Assert.Equal(0m,       r.VacacionesOrdinarias.Monto);
        Assert.Equal(1068.33m, r.VacacionesTruncas.Monto);
        Assert.Equal(1068.33m, r.Total.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Pendientes_15Dias()
    {
        // RC = 3000; pendientes = 3000/30*15 = 1500
        var r = VacacionesCalculadora.Calcular(
            new VacacionesInput(new Money(3000m), false, 0, DiasPendientes: 15), Params);

        Assert.Equal(0m,    r.VacacionesOrdinarias.Monto);
        Assert.Equal(1500m, r.VacacionesPendientes.Monto);
        Assert.Equal(1500m, r.Total.Monto);
    }
}
