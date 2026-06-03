using PeruCalcula.Domain.Laboral;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Fuente: Ley 27735, D.S. 005-2002-TR, Ley 29351 (bonificación extraordinaria).
/// RMV 2024 S/1,025. AsigFamiliar 10%. EsSalud 9%, EPS 6.75%.
/// </summary>
public class GratificacionGoldenTests
{
    private static readonly ParametrosGratificacion Params = new(
        Rmv: new Money(1025m),
        AsignacionFamiliarPct: 10m,
        EssaludBonifPct: 9m,
        EpsBonifPct: 6.75m,
        Version: "2024",
        FechaActualizacion: new DateOnly(2009, 7, 23)
    );

    [Fact]
    [Trait("Category", "Golden")]
    public void Caso_SinHijos_6Meses_EsSalud()
    {
        // RC = 3000; Grati = 3000/6*6 = 3000; Bonif = 9% * 3000 = 270; Total = 3270
        var r = GratificacionCalculadora.Calcular(
            new GratificacionInput(new Money(3000m), false, 6, 0), Params);

        Assert.Equal(3000m, r.Gratificacion.Monto);
        Assert.Equal(270m,  r.BonificacionExtraordinaria.Monto);
        Assert.Equal(3270m, r.TotalDeposito.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Caso_ConHijos_4Meses_EPS()
    {
        // AsigFam = 10% * 1025 = 102.50; RC = 2000 + 102.50 = 2102.50
        // Grati = 2102.50/6*4 = 1401.67; Bonif EPS = 6.75% * 1401.67 = 94.61; Total = 1496.28
        var r = GratificacionCalculadora.Calcular(
            new GratificacionInput(new Money(2000m), true, 4, 0, AportaAEps: true), Params);

        Assert.Equal(102.50m, r.AsignacionFamiliar.Monto);
        Assert.Equal(1401.67m, r.Gratificacion.Monto);
        Assert.Equal(94.61m,   r.BonificacionExtraordinaria.Monto);
        Assert.Equal(1496.28m, r.TotalDeposito.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Faltas_ReducenPeriodoComputable()
    {
        // Básico 3000, 6 meses, 10 días de falta
        // Período efectivo = 6*30 - 10 = 170 días = 5 meses 20 días
        // RC = 3000; Grati = 3000/6*5 + 3000/180*20 = 2500 + 333.33 = 2833.33
        var r = GratificacionCalculadora.Calcular(
            new GratificacionInput(new Money(3000m), false, 6, 0, DiasFaltas: 10), Params);

        Assert.Equal(5,       r.MesesCompletados);
        Assert.Equal(20,      r.DiasAdicionales);
        Assert.Equal(10,      r.DiasFaltas);
        Assert.Equal(2833.33m, r.Gratificacion.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Caso_ConHorasExtras_Regulares_6Meses()
    {
        // HH.EE. regulares (≥ 3 meses) integran RC — Art. 3 Ley 27735
        // RC = 2500 + 0 (sin hijos) + 400 (HH.EE.) + 200 (comisiones) = 3100
        // Grati = 3100/6*6 = 3100; Bonif = 9% * 3100 = 279; Total = 3379
        var r = GratificacionCalculadora.Calcular(
            new GratificacionInput(
                new Money(2500m), false, 6, 0,
                PromedioHorasExtras: new Money(400m),
                PromedioComisiones:  new Money(200m)), Params);

        Assert.Equal(3100m, r.RemuneracionComputable.Monto);
        Assert.Equal(400m,  r.PromedioHorasExtras.Monto);
        Assert.Equal(3100m, r.Gratificacion.Monto);
        Assert.Equal(279m,  r.BonificacionExtraordinaria.Monto);
        Assert.Equal(3379m, r.TotalDeposito.Monto);
    }
}
