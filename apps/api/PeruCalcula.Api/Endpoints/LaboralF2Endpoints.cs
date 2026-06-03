using FluentValidation;
using PeruCalcula.Domain.Laboral;
using PeruCalcula.Shared;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.Endpoints;

public static class LaboralF2Endpoints
{
    public static IEndpointRouteBuilder MapLaboralF2(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/laboral").WithTags("Laboral");

        group.MapPost("/gratificacion", CalcularGratificacion)
             .WithName("CalcularGratificacion")
             .WithSummary("Calcula gratificación ordinaria de julio/diciembre (Ley 27735)");

        group.MapPost("/vacaciones", CalcularVacaciones)
             .WithName("CalcularVacaciones")
             .WithSummary("Calcula vacaciones ordinarias, truncas y pendientes (D.Leg. 713)");

        return app;
    }

    private static async Task<IResult> CalcularGratificacion(
        GratificacionRequest req,
        IParametroService parametros,
        IValidator<GratificacionRequest> validator,
        IClock clock,
        CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var rmv        = await parametros.ObtenerMoneyAsync(ParametroClaves.RMV, ct: ct);
        var asigPct    = await parametros.ObtenerDecimalAsync(ParametroClaves.AsignacionFamiliar, ct: ct);
        var essaludPct = await parametros.ObtenerDecimalAsync(ParametroClaves.EsSaludPct, ct: ct);
        var epsPct     = await parametros.ObtenerDecimalAsync(ParametroClaves.EpsPct, ct: ct);

        var parms = new ParametrosGratificacion(rmv, asigPct, essaludPct, epsPct,
            DateOnly.FromDateTime(clock.UtcNow.DateTime).ToString("yyyy-MM"), new DateOnly(2009, 7, 23));

        var hoy = DateOnly.FromDateTime(clock.UtcNow.DateTime);
        int meses, dias;
        PeriodoResultado? periodo = null;

        if (req.FechaIngreso.HasValue)
        {
            periodo = PeriodoLaboralCalculador.CalcularGratificacion(req.FechaIngreso.Value, hoy, req.PeriodoDeposito);
            meses   = periodo.MesesCompletados;
            dias    = periodo.DiasAdicionales;
        }
        else
        {
            meses = req.MesesCompletados ?? 0;
            dias  = req.DiasAdicionales  ?? 0;
        }

        var resultado = GratificacionCalculadora.Calcular(
            new GratificacionInput(
                new Money(req.RemuneracionBasica), req.TieneHijos, meses, dias, req.AportaAEps,
                new Money(req.PromedioHorasExtras), new Money(req.PromedioComisiones), new Money(req.OtrosBonos),
                DiasFaltas: req.DiasFaltas), parms);

        var desglose = new List<object>
        {
            new { concepto = "Remuneración básica",   valor = req.RemuneracionBasica },
            new { concepto = "Asignación familiar",   valor = resultado.AsignacionFamiliar.Monto },
        };

        if (resultado.PromedioHorasExtras.Monto > 0)
            desglose.Add(new { concepto = "Promedio horas extras/mes", valor = resultado.PromedioHorasExtras.Monto });
        if (resultado.PromedioComisiones.Monto > 0)
            desglose.Add(new { concepto = "Promedio comisiones/mes",   valor = resultado.PromedioComisiones.Monto });
        if (resultado.OtrosBonos.Monto > 0)
            desglose.Add(new { concepto = "Otros bonos regulares/mes", valor = resultado.OtrosBonos.Monto });

        desglose.Add(new { concepto = "Remuneración computable (RC)", valor = resultado.RemuneracionComputable.Monto });

        if (resultado.DiasFaltas > 0)
            desglose.Add(new { concepto = $"Descuento por {resultado.DiasFaltas} día(s) de inasistencia", valor = (decimal)0 });

        desglose.AddRange(new object[]
        {
            new { concepto = $"Gratificación ({resultado.MesesCompletados} meses)",        valor = resultado.Gratificacion.Monto },
            new { concepto = $"Bonificación extraordinaria ({resultado.PctBonificacion}%)", valor = resultado.BonificacionExtraordinaria.Monto },
        });

        return Results.Ok(new
        {
            resultado = new
            {
                gratificacion              = resultado.Gratificacion.Monto,
                bonificacionExtraordinaria = resultado.BonificacionExtraordinaria.Monto,
                totalDeposito              = resultado.TotalDeposito.Monto,
                moneda                     = "PEN",
            },
            periodo = periodo is null ? null : new
            {
                nombre           = periodo.Nombre,
                inicioEfectivo   = periodo.InicioEfectivo.ToString("yyyy-MM-dd"),
                finEfectivo      = periodo.FinEfectivo.ToString("yyyy-MM-dd"),
                mesesCompletados = periodo.MesesCompletados,
                diasAdicionales  = periodo.DiasAdicionales,
            },
            desglose,
            formula   = "Gratificación = (RC/6)×meses + (RC/180)×días  |  RC = básico + asig.familiar + promedios (Ley 27735 Art. 3)",
            confianza = new
            {
                parametrosVersion           = parms.Version,
                fechaActualizacionNormativa = parms.FechaActualizacion.ToString("yyyy-MM-dd"),
                fuente                      = "Ley 27735 / Ley 29351",
                disclaimer                  = "Cálculo referencial. No constituye asesoría legal o tributaria.",
            },
        });
    }

    private static async Task<IResult> CalcularVacaciones(
        VacacionesRequest req,
        IParametroService parametros,
        IValidator<VacacionesRequest> validator,
        IClock clock,
        CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var rmv     = await parametros.ObtenerMoneyAsync(ParametroClaves.RMV, ct: ct);
        var asigPct = await parametros.ObtenerDecimalAsync(ParametroClaves.AsignacionFamiliar, ct: ct);

        var hoy = DateOnly.FromDateTime(clock.UtcNow.DateTime);
        var parms = new ParametrosVacaciones(rmv, asigPct,
            hoy.ToString("yyyy-MM"), new DateOnly(1992, 12, 8));

        int anios, mesesTruncos, diasAdicionales;
        VacacionesPeriodoResultado? periodo = null;

        if (req.FechaIngreso.HasValue)
        {
            periodo         = PeriodoLaboralCalculador.CalcularVacaciones(req.FechaIngreso.Value, hoy);
            anios           = periodo.AniosCompletados;
            mesesTruncos    = periodo.MesesTruncos;
            diasAdicionales = periodo.DiasAdicionales;
        }
        else
        {
            anios           = req.AniosCompletados ?? 0;
            mesesTruncos    = req.MesesTruncos     ?? 0;
            diasAdicionales = req.DiasAdicionales  ?? 0;
        }

        var input = new VacacionesInput(
            RemuneracionBasica:      new Money(req.RemuneracionBasica),
            TieneHijos:              req.TieneHijos,
            AniosCompletados:        anios,
            MesesTruncos:            mesesTruncos,
            DiasPendientes:          req.DiasPendientes,
            DiasAdicionalesTruncos:  diasAdicionales,
            PromedioHorasExtras:     new Money(req.PromedioHorasExtras),
            PromedioComisiones:      new Money(req.PromedioComisiones),
            OtrosBonos:              new Money(req.OtrosBonos),
            DiasFaltasAnio:          req.DiasFaltasAnio
        );

        var resultado = VacacionesCalculadora.Calcular(input, parms);

        var desglose = new List<object>
        {
            new { concepto = "Remuneración básica",   valor = req.RemuneracionBasica },
            new { concepto = "Asignación familiar",   valor = resultado.AsignacionFamiliar.Monto },
        };

        if (resultado.PromedioHorasExtras.Monto > 0)
            desglose.Add(new { concepto = "Promedio horas extras/mes", valor = resultado.PromedioHorasExtras.Monto });
        if (resultado.PromedioComisiones.Monto > 0)
            desglose.Add(new { concepto = "Promedio comisiones/mes",   valor = resultado.PromedioComisiones.Monto });
        if (resultado.OtrosBonos.Monto > 0)
            desglose.Add(new { concepto = "Otros bonos regulares/mes", valor = resultado.OtrosBonos.Monto });

        desglose.Add(new { concepto = "Remuneración computable (RC)", valor = resultado.RemuneracionComputable.Monto });

        if (resultado.VacacionesOrdinarias.Monto > 0)
            desglose.Add(new { concepto = $"Vacaciones ordinarias ({anios} año{(anios != 1 ? "s" : "")})", valor = resultado.VacacionesOrdinarias.Monto });
        if (resultado.VacacionesTruncas.Monto > 0)
            desglose.Add(new { concepto = $"Vacaciones truncas ({mesesTruncos} mes{(mesesTruncos != 1 ? "es" : "")})", valor = resultado.VacacionesTruncas.Monto });
        if (resultado.VacacionesPendientes.Monto > 0)
            desglose.Add(new { concepto = $"Vacaciones pendientes ({req.DiasPendientes} días no gozados)", valor = resultado.VacacionesPendientes.Monto });

        return Results.Ok(new
        {
            resultado = new
            {
                total                = resultado.Total.Monto,
                vacacionesOrdinarias = resultado.VacacionesOrdinarias.Monto,
                vacacionesTruncas    = resultado.VacacionesTruncas.Monto,
                vacacionesPendientes = resultado.VacacionesPendientes.Monto,
                moneda               = "PEN",
            },
            periodo = periodo is null ? null : new
            {
                nombre            = periodo.Nombre,
                ultimoAniversario = periodo.UltimoAniversario.ToString("yyyy-MM-dd"),
                aniosCompletados  = periodo.AniosCompletados,
                mesesTruncos      = periodo.MesesTruncos,
                diasAdicionales   = periodo.DiasAdicionales,
            },
            advertencia = resultado.PierdeDerechoOrdinarias
                ? "Con 30 o más días de inasistencia injustificada en el año, el trabajador pierde el derecho a vacaciones ordinarias de ese período (D.Leg. 713 Art. 11)."
                : null,
            desglose,
            formula   = "Ordinarias = RC mensual | Truncas = RC/12×meses + RC/360×días | Pendientes = RC/30×días  (D.Leg. 713 / D.S. 012-92-TR)",
            confianza = new
            {
                parametrosVersion           = parms.Version,
                fechaActualizacionNormativa = parms.FechaActualizacion.ToString("yyyy-MM-dd"),
                fuente                      = "D.Leg. 713 / D.S. 012-92-TR",
                disclaimer                  = "Cálculo referencial. No constituye asesoría legal.",
            },
        });
    }
}

public sealed record GratificacionRequest(
    decimal   RemuneracionBasica,
    bool      TieneHijos,
    DateOnly? FechaIngreso        = null,
    int?      MesesCompletados    = null,
    int?      DiasAdicionales     = null,
    string?   PeriodoDeposito     = null,  // "julio" | "diciembre"
    bool      AportaAEps          = false,
    decimal   PromedioHorasExtras = 0,
    decimal   PromedioComisiones  = 0,
    decimal   OtrosBonos          = 0,
    int       DiasFaltas          = 0
);
public sealed record VacacionesRequest(
    decimal   RemuneracionBasica,
    bool      TieneHijos,
    DateOnly? FechaIngreso        = null,
    int?      AniosCompletados    = null,
    int?      MesesTruncos        = null,
    int?      DiasAdicionales     = null,
    int       DiasPendientes      = 0,
    decimal   PromedioHorasExtras = 0,
    decimal   PromedioComisiones  = 0,
    decimal   OtrosBonos          = 0,
    int       DiasFaltasAnio      = 0   // faltas en el año: ≥ 30 → pierde derecho vacacional (D.Leg. 713 Art. 11)
);

public sealed class GratificacionRequestValidator : AbstractValidator<GratificacionRequest>
{
    public GratificacionRequestValidator()
    {
        RuleFor(x => x.RemuneracionBasica).GreaterThan(0);
        RuleFor(x => x.MesesCompletados).InclusiveBetween(0, 6).When(x => x.MesesCompletados.HasValue);
        RuleFor(x => x.DiasAdicionales).InclusiveBetween(0, 29).When(x => x.DiasAdicionales.HasValue);
        RuleFor(x => x.PromedioHorasExtras).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PromedioComisiones).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OtrosBonos).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DiasFaltas).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PeriodoDeposito)
            .Must(p => p is null or "julio" or "diciembre")
            .WithMessage("periodoDeposito debe ser 'julio' o 'diciembre'.");
        RuleFor(x => x)
            .Must(x => x.FechaIngreso.HasValue || (x.MesesCompletados.HasValue && x.DiasAdicionales.HasValue))
            .WithMessage("Indica 'fechaIngreso' o 'mesesCompletados' + 'diasAdicionales'.");
    }
}

public sealed class VacacionesRequestValidator : AbstractValidator<VacacionesRequest>
{
    public VacacionesRequestValidator()
    {
        RuleFor(x => x.RemuneracionBasica).GreaterThan(0);
        RuleFor(x => x.AniosCompletados).GreaterThanOrEqualTo(0).When(x => x.AniosCompletados.HasValue);
        RuleFor(x => x.MesesTruncos).InclusiveBetween(0, 11).When(x => x.MesesTruncos.HasValue);
        RuleFor(x => x.DiasAdicionales).InclusiveBetween(0, 30).When(x => x.DiasAdicionales.HasValue);
        RuleFor(x => x.DiasPendientes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PromedioHorasExtras).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PromedioComisiones).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OtrosBonos).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DiasFaltasAnio).GreaterThanOrEqualTo(0);
        RuleFor(x => x)
            .Must(x => x.FechaIngreso.HasValue || x.AniosCompletados.HasValue)
            .WithMessage("Indica 'fechaIngreso' o 'aniosCompletados'.");
    }
}
