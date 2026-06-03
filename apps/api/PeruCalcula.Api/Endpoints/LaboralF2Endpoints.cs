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
        CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var rmv              = await parametros.ObtenerMoneyAsync(ParametroClaves.RMV, ct: ct);
        var asigPct          = await parametros.ObtenerDecimalAsync(ParametroClaves.AsignacionFamiliar, ct: ct);
        var essaludPct       = await parametros.ObtenerDecimalAsync(ParametroClaves.EsSaludPct, ct: ct);
        var epsPct           = await parametros.ObtenerDecimalAsync(ParametroClaves.EpsPct, ct: ct);

        var parms = new ParametrosGratificacion(rmv, asigPct, essaludPct, epsPct,
            DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM"), new DateOnly(2009, 7, 23));

        var resultado = GratificacionCalculadora.Calcular(
            new GratificacionInput(new Money(req.RemuneracionBasica), req.TieneHijos,
                                   req.MesesCompletados, req.DiasAdicionales, req.AportaAEps), parms);

        return Results.Ok(new
        {
            resultado = new
            {
                gratificacion              = resultado.Gratificacion.Monto,
                bonificacionExtraordinaria = resultado.BonificacionExtraordinaria.Monto,
                totalDeposito              = resultado.TotalDeposito.Monto,
                moneda                     = "PEN",
            },
            desglose = new[]
            {
                new { concepto = "Remuneración básica",           valor = req.RemuneracionBasica },
                new { concepto = "Asignación familiar",           valor = resultado.AsignacionFamiliar.Monto },
                new { concepto = "Remuneración computable (RC)",  valor = resultado.RemuneracionComputable.Monto },
                new { concepto = $"Gratificación ({resultado.MesesCompletados} meses)", valor = resultado.Gratificacion.Monto },
                new { concepto = $"Bonificación extraordinaria ({resultado.PctBonificacion}%)", valor = resultado.BonificacionExtraordinaria.Monto },
            },
            formula = "Gratificación = (RC/6) × meses | Bonif.Ext = Grati × %EsSalud/EPS",
            confianza = new
            {
                parametrosVersion           = parms.Version,
                fechaActualizacionNormativa = parms.FechaActualizacion.ToString("yyyy-MM-dd"),
                fuente                      = "Ley 27735 / Ley 29351",
                disclaimer                  = "Cálculo referencial. No constituye asesoría legal.",
            },
        });
    }

    private static async Task<IResult> CalcularVacaciones(
        VacacionesRequest req,
        IParametroService parametros,
        IValidator<VacacionesRequest> validator,
        CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var rmv     = await parametros.ObtenerMoneyAsync(ParametroClaves.RMV, ct: ct);
        var asigPct = await parametros.ObtenerDecimalAsync(ParametroClaves.AsignacionFamiliar, ct: ct);

        var parms = new ParametrosVacaciones(rmv, asigPct,
            DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM"), new DateOnly(1992, 12, 8));

        var resultado = VacacionesCalculadora.Calcular(
            new VacacionesInput(new Money(req.RemuneracionMensual), req.TieneHijos,
                                req.AniosCompletados, req.MesesTruncos, req.DiasPendientes), parms);

        return Results.Ok(new
        {
            resultado = new
            {
                total                 = resultado.Total.Monto,
                vacacionesOrdinarias  = resultado.VacacionesOrdinarias.Monto,
                vacacionesTruncas     = resultado.VacacionesTruncas.Monto,
                vacacionesPendientes  = resultado.VacacionesPendientes.Monto,
                moneda                = "PEN",
            },
            desglose = new[]
            {
                new { concepto = "Remuneración computable",   valor = resultado.RemuneracionComputable.Monto },
                new { concepto = "Vacaciones ordinarias",     valor = resultado.VacacionesOrdinarias.Monto },
                new { concepto = "Vacaciones truncas",        valor = resultado.VacacionesTruncas.Monto },
                new { concepto = "Vacaciones pendientes",     valor = resultado.VacacionesPendientes.Monto },
            },
            formula = "Ordinarias = RC mensual | Truncas = RC/12×meses | Pendientes = RC/30×días",
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

public sealed record GratificacionRequest(decimal RemuneracionBasica, bool TieneHijos, int MesesCompletados, int DiasAdicionales, bool AportaAEps = false);
public sealed record VacacionesRequest(decimal RemuneracionMensual, bool TieneHijos, int AniosCompletados, int MesesTruncos = 0, int DiasPendientes = 0);

public sealed class GratificacionRequestValidator : AbstractValidator<GratificacionRequest>
{
    public GratificacionRequestValidator()
    {
        RuleFor(x => x.RemuneracionBasica).GreaterThan(0);
        RuleFor(x => x.MesesCompletados).InclusiveBetween(0, 6);
        RuleFor(x => x.DiasAdicionales).InclusiveBetween(0, 29);
    }
}

public sealed class VacacionesRequestValidator : AbstractValidator<VacacionesRequest>
{
    public VacacionesRequestValidator()
    {
        RuleFor(x => x.RemuneracionMensual).GreaterThan(0);
        RuleFor(x => x.AniosCompletados).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MesesTruncos).InclusiveBetween(0, 11);
        RuleFor(x => x.DiasPendientes).GreaterThanOrEqualTo(0);
    }
}
