using PeruCalcula.Domain.Laboral;
using PeruCalcula.Shared;
using Xunit;

namespace PeruCalcula.Tests.Calculadoras;

/// <summary>
/// Golden tests contra casos normativos de la SUNAFIL / D.Leg. 650.
/// Fuente: docs/normativa/laboral/cts.md
/// </summary>
public class CtsGoldenTests
{
    private static readonly ParametrosCts Params2024 = new(
        Rmv: new Money(1025m),
        AsignacionFamiliarPct: 10m,
        Version: "2024",
        FechaActualizacion: new DateOnly(2022, 5, 1)
    );

    // ── Casos sin variables ──────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Golden")]
    public void CasoBásico_SinHijos_4Meses()
    {
        // RC = 2000 + 2000/6 = 2333.33
        // CTS = 2333.33/12 * 4 = 777.78
        var r = CtsCalculadora.Calcular(
            new CtsInput(new Money(2000m), TieneHijos: false, MesesCompletados: 4, DiasAdicionales: 0),
            Params2024);

        Assert.Equal(333.33m, r.SextaGratificacion.Monto);
        Assert.Equal(777.78m, r.MontoFinal.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void CasoConHijos_4Meses15Dias()
    {
        // Asig.familiar = 10% * 1025 = 102.50
        // RC = 3000 + 102.50 + 500 = 3602.50
        // CTS meses = 3602.50/12 * 4 = 1200.83 | días = 3602.50/360 * 15 = 150.10
        var r = CtsCalculadora.Calcular(
            new CtsInput(new Money(3000m), TieneHijos: true, MesesCompletados: 4, DiasAdicionales: 15),
            Params2024);

        Assert.Equal(102.50m, r.AsignacionFamiliar.Monto);
        Assert.Equal(500.00m, r.SextaGratificacion.Monto);
        Assert.Equal(3602.50m, r.RemuneracionComputable.Monto);
        Assert.Equal(1200.83m, r.CtsMeses.Monto);
        Assert.Equal(150.10m, r.CtsDias.Monto);
        Assert.Equal(1350.93m, r.MontoFinal.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Sueldo_RMV_SinHijos_4Meses()
    {
        var r = CtsCalculadora.Calcular(
            new CtsInput(new Money(1025m), TieneHijos: false, MesesCompletados: 4, DiasAdicionales: 0),
            Params2024);

        Assert.Equal(170.83m, r.SextaGratificacion.Monto);
        Assert.Equal(398.61m, r.MontoFinal.Monto);
    }

    // ── Casos con remuneraciones variables (D.Leg. 650 Art. 9) ───────────────

    [Fact]
    [Trait("Category", "Golden")]
    public void ConHorasExtras_SeIncluyen_EnRC()
    {
        // Básico 3000, HH.EE. promedio 200/mes, sin hijos, 4 meses
        // RC = 3000 + 3000/6 + 200 = 3000 + 500 + 200 = 3700
        // CTS = 3700/12 * 4 = 1233.33
        var r = CtsCalculadora.Calcular(
            new CtsInput(new Money(3000m), TieneHijos: false, MesesCompletados: 4, DiasAdicionales: 0,
                PromedioHorasExtras: new Money(200m)),
            Params2024);

        Assert.Equal(3700.00m, r.RemuneracionComputable.Monto);
        Assert.Equal(200.00m,  r.PromedioHorasExtras.Monto);
        Assert.Equal(1233.33m, r.MontoFinal.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void ConComisiones_SeIncluyen_EnRC()
    {
        // Básico 2000, comisiones 500/mes, sin hijos, 6 meses completos
        // RC = 2000 + 2000/6 + 500 = 2000 + 333.33 + 500 = 2833.33
        // CTS = 2833.33/12 * 6 = 1416.67
        var r = CtsCalculadora.Calcular(
            new CtsInput(new Money(2000m), TieneHijos: false, MesesCompletados: 6, DiasAdicionales: 0,
                PromedioComisiones: new Money(500m)),
            Params2024);

        Assert.Equal(2833.33m, r.RemuneracionComputable.Monto);
        Assert.Equal(1416.67m, r.MontoFinal.Monto);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void CasoCompleto_TodosLosConceptos()
    {
        // Básico 4000, hijos, HH.EE. 300, comisiones 400, bonos 100, 4m 10d
        // Asig.fam = 10% * 1025 = 102.50
        // Sexta = 4000/6 = 666.67
        // RC = 4000 + 102.50 + 666.67 + 300 + 400 + 100 = 5569.17
        // CTS meses = 5569.17/12 * 4 = 1856.39
        // CTS días  = 5569.17/360 * 10 = 154.70
        // Total = 2011.09
        var r = CtsCalculadora.Calcular(
            new CtsInput(new Money(4000m), TieneHijos: true, MesesCompletados: 4, DiasAdicionales: 10,
                PromedioHorasExtras: new Money(300m),
                PromedioComisiones:  new Money(400m),
                OtrosBonos:          new Money(100m)),
            Params2024);

        Assert.Equal(102.50m,  r.AsignacionFamiliar.Monto);
        Assert.Equal(666.67m,  r.SextaGratificacion.Monto);
        Assert.Equal(5569.17m, r.RemuneracionComputable.Monto);
        Assert.Equal(1856.39m, r.CtsMeses.Monto);
        Assert.Equal(154.70m,  r.CtsDias.Monto);
        Assert.Equal(2011.09m, r.MontoFinal.Monto);
    }
}

/// <summary>
/// Golden tests para PeriodoLaboralCalculador.
/// </summary>
public class PeriodoLaboralGoldenTests
{
    // ── CTS ──────────────────────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Golden")]
    public void Cts_PeriodoMayo_IngresadoEnero_6Meses()
    {
        // Período normativo: 1 nov → 30 abr. Ingresó en enero → inicia desde nov.
        // Hoy = 30 abr 2026. Completo = 6 meses (1-nov a 30-abr).
        var hoy    = new DateOnly(2026, 4, 30);
        var ingreso = new DateOnly(2026, 1, 15);
        var r = PeriodoLaboralCalculador.CalcularCts(ingreso, hoy);

        // Ingresó en enero, pero el período normativo empezó en nov 2025.
        // Inicio efectivo = enero 15 → meses desde 15-ene a 30-abr
        // 15-ene → 15-feb → 15-mar → 15-abr = 3 meses. Días: 30-abr - 15-abr = 15
        Assert.Equal(3, r.MesesCompletados);
        Assert.Equal(15, r.DiasAdicionales);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Cts_PeriodoNoviembre_SemestreCompleto()
    {
        // Período normativo: 1 may → 31 oct. Ingresó antes del período.
        // Hoy = 31 oct 2026 (fin del período). Completo = 6 meses.
        var hoy     = new DateOnly(2026, 10, 31);
        var ingreso = new DateOnly(2025, 3, 1);  // antes del período
        var r = PeriodoLaboralCalculador.CalcularCts(ingreso, hoy);

        Assert.Equal(6,  r.MesesCompletados);
        Assert.Equal(0,  r.DiasAdicionales);
        Assert.Equal(new DateOnly(2026, 5, 1),  r.InicioEfectivo);
        Assert.Equal(new DateOnly(2026, 10, 31), r.FinEfectivo);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Cts_IngresadoMitadPeriodo_MesesProporcionales()
    {
        // Período: 1 may → 31 oct. Ingresó el 15 jul. Hoy = 31 oct.
        // Inicio efectivo = 15 jul. 15-jul → 15-ago → 15-sep → 15-oct = 3 meses, 16 días restantes.
        var hoy     = new DateOnly(2026, 10, 31);
        var ingreso = new DateOnly(2026, 7, 15);
        var r = PeriodoLaboralCalculador.CalcularCts(ingreso, hoy);

        Assert.Equal(3, r.MesesCompletados);
        Assert.Equal(16, r.DiasAdicionales);
    }

    // ── Gratificación ─────────────────────────────────────────────────────────

    [Fact]
    [Trait("Category", "Golden")]
    public void Grati_PeriodoJulio_SemestreCompleto()
    {
        // Período: 1 ene → 30 jun. Ingresó antes. Hoy = 30 jun.
        var hoy     = new DateOnly(2026, 6, 30);
        var ingreso = new DateOnly(2025, 11, 1);
        var r = PeriodoLaboralCalculador.CalcularGratificacion(ingreso, hoy);

        Assert.Equal(6, r.MesesCompletados);
        Assert.Equal(0, r.DiasAdicionales);
    }

    [Fact]
    [Trait("Category", "Golden")]
    public void Grati_IngresadoMitadPeriodo_Proporcional()
    {
        // Período: 1 ene → 30 jun. Ingresó el 15 mar. Hoy = 30 jun.
        // 15-mar → 15-abr → 15-may → 15-jun = 3 meses, 15 días
        var hoy     = new DateOnly(2026, 6, 30);
        var ingreso = new DateOnly(2026, 3, 15);
        var r = PeriodoLaboralCalculador.CalcularGratificacion(ingreso, hoy);

        Assert.Equal(3, r.MesesCompletados);
        Assert.Equal(15, r.DiasAdicionales);
    }
}
