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
        IClock clock,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(req, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var rmv             = await parametros.ObtenerMoneyAsync(ParametroClaves.RMV, ct: ct);
        var asigFamiliarPct = await parametros.ObtenerDecimalAsync(ParametroClaves.AsignacionFamiliar, ct: ct);

        var parms = new ParametrosCts(
            Rmv:                   rmv,
            AsignacionFamiliarPct: asigFamiliarPct,
            Version:               DateOnly.FromDateTime(clock.UtcNow.DateTime).ToString("yyyy-MM"),
            FechaActualizacion:    new DateOnly(2022, 5, 1)
        );

        // Período: auto-calculado desde fecha de ingreso o ingresado manualmente
        var hoy = DateOnly.FromDateTime(clock.UtcNow.DateTime);
        int meses, dias;
        PeriodoResultado? periodo = null;

        if (req.FechaIngreso.HasValue)
        {
            periodo = PeriodoLaboralCalculador.CalcularCts(req.FechaIngreso.Value, hoy);
            meses   = periodo.MesesCompletados;
            dias    = periodo.DiasAdicionales;
        }
        else
        {
            meses = req.MesesCompletados ?? 0;
            dias  = req.DiasAdicionales  ?? 0;
        }

        var input = new CtsInput(
            RemuneracionBasica:  new Money(req.RemuneracionBasica),
            TieneHijos:          req.TieneHijos,
            MesesCompletados:    meses,
            DiasAdicionales:     dias,
            PromedioHorasExtras: new Money(req.PromedioHorasExtras),
            PromedioComisiones:  new Money(req.PromedioComisiones),
            OtrosBonos:          new Money(req.OtrosBonos)
        );

        var resultado = CtsCalculadora.Calcular(input, parms);

        var desglose = new List<object>
        {
            new { concepto = "Remuneración básica",     valor = req.RemuneracionBasica },
            new { concepto = "Asignación familiar",     valor = resultado.AsignacionFamiliar.Monto },
            new { concepto = "1/6 gratificación",       valor = resultado.SextaGratificacion.Monto },
        };

        if (resultado.PromedioHorasExtras.Monto > 0)
            desglose.Add(new { concepto = "Promedio horas extras/mes", valor = resultado.PromedioHorasExtras.Monto });
        if (resultado.PromedioComisiones.Monto > 0)
            desglose.Add(new { concepto = "Promedio comisiones/mes",   valor = resultado.PromedioComisiones.Monto });
        if (resultado.OtrosBonos.Monto > 0)
            desglose.Add(new { concepto = "Otros bonos regulares/mes", valor = resultado.OtrosBonos.Monto });

        desglose.AddRange(new object[]
        {
            new { concepto = "Remuneración computable",                                valor = resultado.RemuneracionComputable.Monto },
            new { concepto = $"CTS por {resultado.MesesCompletados} meses",           valor = resultado.CtsMeses.Monto },
            new { concepto = $"CTS por {resultado.DiasAdicionales} días adicionales", valor = resultado.CtsDias.Monto },
        });

        return Results.Ok(new
        {
            resultado = new { montoFinal = resultado.MontoFinal.Monto, moneda = "PEN" },
            periodo = periodo is null ? null : new
            {
                nombre           = periodo.Nombre,
                inicioEfectivo   = periodo.InicioEfectivo.ToString("yyyy-MM-dd"),
                finEfectivo      = periodo.FinEfectivo.ToString("yyyy-MM-dd"),
                mesesCompletados = periodo.MesesCompletados,
                diasAdicionales  = periodo.DiasAdicionales,
            },
            desglose,
            formula   = "CTS = (RC/12)×meses + (RC/360)×días  |  RC = básico + asig.familiar + 1/6 grati + promedios (D.Leg. 650 Art. 9)",
            confianza = new
            {
                parametrosVersion           = parms.Version,
                fechaActualizacionNormativa = parms.FechaActualizacion.ToString("yyyy-MM-dd"),
                fuente                      = "D.Leg. 650 / SUNAFIL",
                disclaimer                  = "Cálculo referencial. No constituye asesoría legal.",
            },
        });
    }
}

public sealed record CtsRequest(
    decimal   RemuneracionBasica,
    bool      TieneHijos,
    DateOnly? FechaIngreso       = null,   // auto-calcula período normativo
    int?      MesesCompletados   = null,   // alternativa manual
    int?      DiasAdicionales    = null,   // alternativa manual
    decimal   PromedioHorasExtras = 0,     // promedio mensual HH.EE. (últimos 6 meses)
    decimal   PromedioComisiones  = 0,     // promedio mensual comisiones del semestre
    decimal   OtrosBonos          = 0      // promedio mensual otros bonos regulares
);

public sealed class CtsRequestValidator : AbstractValidator<CtsRequest>
{
    public CtsRequestValidator()
    {
        RuleFor(x => x.RemuneracionBasica).GreaterThan(0);
        RuleFor(x => x.MesesCompletados).InclusiveBetween(0, 6).When(x => x.MesesCompletados.HasValue);
        RuleFor(x => x.DiasAdicionales).InclusiveBetween(0, 29).When(x => x.DiasAdicionales.HasValue);
        RuleFor(x => x.PromedioHorasExtras).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PromedioComisiones).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OtrosBonos).GreaterThanOrEqualTo(0);
        RuleFor(x => x)
            .Must(x => x.FechaIngreso.HasValue || (x.MesesCompletados.HasValue && x.DiasAdicionales.HasValue))
            .WithMessage("Indica 'fechaIngreso' o 'mesesCompletados' + 'diasAdicionales'.");
    }
}
