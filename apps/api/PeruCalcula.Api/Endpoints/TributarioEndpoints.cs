using FluentValidation;
using PeruCalcula.Domain.Tributario;
using PeruCalcula.Shared;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.Endpoints;

public static class TributarioEndpoints
{
    public static IEndpointRouteBuilder MapTributario(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tributario").WithTags("Tributario");

        group.MapPost("/recibos-honorarios", CalcularRecibos)
             .WithName("CalcularRecibosHonorarios")
             .WithSummary("Calcula retención de 4ta categoría (Art. 74 TUO LIR)");

        return app;
    }

    private static async Task<IResult> CalcularRecibos(
        RecibosHonorariosRequest req,
        IParametroService parametros,
        IValidator<RecibosHonorariosRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(req, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var tasaPct  = await parametros.ObtenerDecimalAsync(ParametroClaves.Retención4taPct, ct: ct);
        var umbral   = await parametros.ObtenerMoneyAsync(ParametroClaves.Retención4taUmbral, ct: ct);
        var uit      = await parametros.ObtenerMoneyAsync(ParametroClaves.UIT, ct: ct);

        var parms = new ParametrosRecibos(
            TasaRetencionPct:   tasaPct,
            UmbralMensual:      umbral,
            Uit:                uit,
            Version:            DateOnly.FromDateTime(DateTime.Today).ToString("yyyy"),
            FechaActualizacion: new DateOnly(2026, 1, 1)
        );

        var resultado = RecibosHonorariosCalculadora.Calcular(
            new RecibosInput(new Money(req.MontoRecibo)), parms);

        return Results.Ok(new
        {
            resultado = new
            {
                montoRecibo      = resultado.MontoRecibo.Monto,
                aplicaRetencion  = resultado.AplicaRetencion,
                montoRetencion   = resultado.MontoRetencion.Monto,
                montoNeto        = resultado.MontoNeto.Monto,
                moneda           = "PEN",
            },
            desglose = new[]
            {
                new { concepto = "Monto del recibo",           valor = resultado.MontoRecibo.Monto },
                new { concepto = $"Retención {tasaPct}% (4ta)", valor = resultado.MontoRetencion.Monto },
                new { concepto = "Monto neto a cobrar",        valor = resultado.MontoNeto.Monto },
            },
            suspension = new
            {
                calificaSuspension = resultado.CalificaSuspension,
                proyeccionAnual    = resultado.ProyeccionAnual.Monto,
                limiteExencion     = resultado.LimiteExencion.Monto,
                uit                = uit.Monto,
                mensaje            = resultado.CalificaSuspension
                    ? "Puede solicitar suspensión de retención a SUNAT si tu proyección anual no supera 7 UIT."
                    : "No califica para suspensión de retención.",
            },
            confianza = new
            {
                parametrosVersion            = parms.Version,
                fechaActualizacionNormativa  = parms.FechaActualizacion.ToString("yyyy-MM-dd"),
                fuente                       = "Art. 74 TUO LIR / SUNAT",
                disclaimer                   = "Cálculo referencial. Verifica con tu contador.",
            },
        });
    }
}

public sealed record RecibosHonorariosRequest(decimal MontoRecibo);

public sealed class RecibosHonorariosRequestValidator : AbstractValidator<RecibosHonorariosRequest>
{
    public RecibosHonorariosRequestValidator()
    {
        RuleFor(x => x.MontoRecibo).GreaterThan(0).WithMessage("El monto del recibo debe ser mayor a 0.");
    }
}
