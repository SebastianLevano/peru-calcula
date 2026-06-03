using FluentValidation;
using PeruCalcula.Domain.Finanzas;
using PeruCalcula.Shared;

namespace PeruCalcula.Api.Endpoints;

public static class FinanzasEndpoints
{
    public static IEndpointRouteBuilder MapFinanzas(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/finanzas").WithTags("Finanzas");

        group.MapPost("/credito-personal", CalcularCreditoPersonal)
             .WithName("CalcularCreditoPersonal")
             .WithSummary("Calcula cuota y cronograma de crédito personal (sistema francés)");

        return app;
    }

    private static async Task<IResult> CalcularCreditoPersonal(
        CreditoPersonalRequest req,
        IValidator<CreditoPersonalRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(req, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(req.Monto), req.PlazoMeses, req.Tea / 100m));

        return Results.Ok(new
        {
            resultado = new
            {
                cuota          = resultado.Cuota.Monto,
                tem            = Math.Round(resultado.Tem * 100, 4),
                totalPagado    = resultado.TotalPagado.Monto,
                totalIntereses = resultado.TotalIntereses.Monto,
                moneda         = "PEN",
            },
            desglose = new[]
            {
                new { concepto = "Monto del crédito",   valor = req.Monto },
                new { concepto = "Plazo (meses)",        valor = (decimal)req.PlazoMeses },
                new { concepto = "TEA (%)",              valor = req.Tea },
                new { concepto = "TEM (%)",              valor = Math.Round(resultado.Tem * 100, 4) },
                new { concepto = "Cuota mensual",        valor = resultado.Cuota.Monto },
                new { concepto = "Total a pagar",        valor = resultado.TotalPagado.Monto },
                new { concepto = "Total intereses",      valor = resultado.TotalIntereses.Monto },
            },
            cronograma = resultado.Cronograma.Select(c => new
            {
                mes          = c.Numero,
                cuota        = c.Cuota.Monto,
                interes      = c.Interes.Monto,
                amortizacion = c.Amortizacion.Monto,
                saldo        = c.Saldo.Monto,
            }),
            formula = "cuota = P·i·(1+i)^n / ((1+i)^n − 1)  |  i = TEM = (1+TEA)^(1/12) − 1",
            confianza = new
            {
                parametrosVersion            = "N/A",
                fechaActualizacionNormativa  = (string?)null,
                fuente                       = "Sistema francés de amortización",
                disclaimer                   = "Cálculo referencial basado en tasa informada. Puede diferir de la liquidación oficial del banco.",
            },
        });
    }
}

public sealed record CreditoPersonalRequest(
    decimal Monto,
    int     PlazoMeses,
    decimal Tea      // porcentaje, ej: 25 = 25% TEA
);

public sealed class CreditoPersonalRequestValidator : AbstractValidator<CreditoPersonalRequest>
{
    public CreditoPersonalRequestValidator()
    {
        RuleFor(x => x.Monto).GreaterThan(0);
        RuleFor(x => x.PlazoMeses).InclusiveBetween(1, 360);
        RuleFor(x => x.Tea).GreaterThanOrEqualTo(0).LessThanOrEqualTo(1000);
    }
}
