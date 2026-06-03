using FluentValidation;
using PeruCalcula.Domain.Laboral;
using PeruCalcula.Shared;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.Endpoints;

public static class LaboralEndpoints
{
    public static IEndpointRouteBuilder MapLaboral(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/laboral").WithTags("Laboral");

        group.MapPost("/cts", CalcularCts)
             .WithName("CalcularCts")
             .WithSummary("Calcula la CTS semestral (D.Leg. 650)");

        return app;
    }

    private static async Task<IResult> CalcularCts(
        CtsRequest req,
        IParametroService parametros,
        IValidator<CtsRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(req, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var rmv               = await parametros.ObtenerMoneyAsync(ParametroClaves.RMV, ct: ct);
        var asigFamiliarPct   = await parametros.ObtenerDecimalAsync(ParametroClaves.AsignacionFamiliar, ct: ct);

        var parms = new ParametrosCts(
            Rmv:                   rmv,
            AsignacionFamiliarPct: asigFamiliarPct,
            Version:               DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM"),
            FechaActualizacion:    new DateOnly(2022, 5, 1)
        );

        var input = new CtsInput(
            RemuneracionBasica: new Money(req.RemuneracionBasica),
            TieneHijos:         req.TieneHijos,
            MesesCompletados:   req.MesesCompletados,
            DiasAdicionales:    req.DiasAdicionales
        );

        var resultado = CtsCalculadora.Calcular(input, parms);

        return Results.Ok(new
        {
            resultado = new
            {
                montoFinal = resultado.MontoFinal.Monto,
                moneda     = resultado.MontoFinal.Moneda.ToString(),
            },
            desglose = new[]
            {
                new { concepto = "Remuneración básica",         valor = req.RemuneracionBasica },
                new { concepto = "Asignación familiar",         valor = resultado.AsignacionFamiliar.Monto },
                new { concepto = "1/6 gratificación",           valor = resultado.SextaGratificacion.Monto },
                new { concepto = "Remuneración computable",     valor = resultado.RemuneracionComputable.Monto },
                new { concepto = $"CTS por {resultado.MesesCompletados} meses", valor = resultado.CtsMeses.Monto },
                new { concepto = $"CTS por {resultado.DiasAdicionales} días",   valor = resultado.CtsDias.Monto },
            },
            formula = "CTS = (RC/12)×meses + (RC/360)×días",
            confianza = new
            {
                parametrosVersion            = parms.Version,
                fechaActualizacionNormativa  = parms.FechaActualizacion.ToString("yyyy-MM-dd"),
                fuente                       = "D.Leg. 650 / SUNAFIL",
                disclaimer                   = "Cálculo referencial. No constituye asesoría legal.",
            },
        });
    }
}

public sealed record CtsRequest(
    decimal RemuneracionBasica,
    bool    TieneHijos,
    int     MesesCompletados,
    int     DiasAdicionales
);

public sealed class CtsRequestValidator : AbstractValidator<CtsRequest>
{
    public CtsRequestValidator()
    {
        RuleFor(x => x.RemuneracionBasica).GreaterThan(0).WithMessage("La remuneración básica debe ser mayor a 0.");
        RuleFor(x => x.MesesCompletados).InclusiveBetween(0, 6);
        RuleFor(x => x.DiasAdicionales).InclusiveBetween(0, 29);
    }
}
