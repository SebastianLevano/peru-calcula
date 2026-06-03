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
        // RC = 2500 → ordinarias = 2500
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

    [Fact]
    [Trait("Category", "Golden")]
    public void Variables_HorasExtras_Comisiones()
    {
        // RC = 2000 + 0 (sin hijos) + 300 (HH.EE.) + 200 (comisiones) = 2500
        // Ordinarias (1 año) = 2500
        var r = VacacionesCalculadora.Calcular(
            new VacacionesInput(
                RemuneracionBasica:   new Money(2000m),
                TieneHijos:           false,
                AniosCompletados:     1,
                PromedioHorasExtras:  new Money(300m),
                PromedioComisiones:   new Money(200m)), Params);

        Assert.Equal(2500m, r.RemuneracionComputable.Monto);
        Assert.Equal(2500m, r.VacacionesOrdinarias.Monto);
        Assert.Equal(300m,  r.PromedioHorasExtras.Monto);
        Assert.Equal(200m,  r.PromedioComisiones.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void TruncasDias_MesesYDias()
    {
        // RC = 1800; truncas = 1800/12*3 + 1800/360*15 = 450 + 75 = 525
        var r = VacacionesCalculadora.Calcular(
            new VacacionesInput(
                RemuneracionBasica:      new Money(1800m),
                TieneHijos:              false,
                AniosCompletados:        0,
                MesesTruncos:            3,
                DiasAdicionalesTruncos:  15), Params);

        Assert.Equal(0m,    r.VacacionesOrdinarias.Monto);
        Assert.Equal(525m,  r.VacacionesTruncas.Monto);
        Assert.Equal(525m,  r.Total.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void PeriodoVacaciones_FechaIngreso()
    {
        // Ingreso 2022-03-15, hoy 2026-06-03 → 4 años, 2 meses, 19 días
        var p = PeriodoLaboralCalculador.CalcularVacaciones(
            new DateOnly(2022, 3, 15),
            new DateOnly(2026, 6, 3));

        Assert.Equal(4,  p.AniosCompletados);
        Assert.Equal(2,  p.MesesTruncos);
        Assert.Equal(19, p.DiasAdicionales);
    }
}
