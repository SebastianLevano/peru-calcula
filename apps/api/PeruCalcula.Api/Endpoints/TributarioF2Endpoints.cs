using FluentValidation;
using PeruCalcula.Domain.Tributario;
using PeruCalcula.Shared;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.Endpoints;

public static class TributarioF2Endpoints
{
    public static IEndpointRouteBuilder MapTributarioF2(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tributario").WithTags("Tributario");

        group.MapPost("/nrus",  CalcularNrus) .WithName("CalcularNrus") .WithSummary("Cuota mensual Nuevo RUS (D.Leg. 937)");
        group.MapPost("/rer",   CalcularRer)  .WithName("CalcularRer")  .WithSummary("Pago mensual RER, 1.5% ingresos netos");
        group.MapPost("/mype",  CalcularMype) .WithName("CalcularMype") .WithSummary("Pago a cuenta mensual y renta anual RMT (D.Leg. 1269)");

        return app;
    }

    private static async Task<IResult> CalcularNrus(
        NrusRequest req, IParametroService parametros,
        IValidator<NrusRequest> validator, CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var parms = new ParametrosNrus(
            Cat1Tope:  await parametros.ObtenerMoneyAsync(ParametroClaves.NrusCat1Tope,  ct: ct),
            Cat1Cuota: await parametros.ObtenerMoneyAsync(ParametroClaves.NrusCat1Cuota, ct: ct),
            Cat2Tope:  await parametros.ObtenerMoneyAsync(ParametroClaves.NrusCat2Tope,  ct: ct),
            Cat2Cuota: await parametros.ObtenerMoneyAsync(ParametroClaves.NrusCat2Cuota, ct: ct),
            TopeAnual: await parametros.ObtenerMoneyAsync(ParametroClaves.NrusTopeAnual, ct: ct),
            Version: DateOnly.FromDateTime(DateTime.Today).ToString("yyyy"),
            FechaActualizacion: new DateOnly(2004, 1, 1));

        var r = NrusCalculadora.Calcular(new NrusInput(new Money(req.IngresosMensuales), new Money(req.ComprasMensuales)), parms);

        return Results.Ok(new
        {
            resultado = new { r.Categoria, cuota = r.Cuota.Monto, moneda = "PEN", alerta = r.Alerta },
            desglose = new[]
            {
                new { concepto = "Ingresos mensuales",      valor = req.IngresosMensuales },
                new { concepto = "Compras mensuales",       valor = req.ComprasMensuales },
                new { concepto = "Referencia (mayor)",      valor = r.ReferenciaMaxima.Monto },
                new { concepto = "Categoría",               valor = (decimal)r.Categoria },
                new { concepto = "Cuota mensual",           valor = r.Cuota.Monto },
            },
            confianza = new { parametrosVersion = parms.Version, fuente = "D.Leg. 937 / SUNAT",
                              disclaimer = "Cálculo referencial. Verifica con tu contador." },
        });
    }

    private static async Task<IResult> CalcularRer(
        RerRequest req, IParametroService parametros,
        IValidator<RerRequest> validator, CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var parms = new ParametrosRer(
            TasaPct:   await parametros.ObtenerDecimalAsync(ParametroClaves.RerPctIngresos, ct: ct),
            TopeAnual: await parametros.ObtenerMoneyAsync(ParametroClaves.RerTopeAnual,   ct: ct),
            Version: DateOnly.FromDateTime(DateTime.Today).ToString("yyyy"),
            FechaActualizacion: new DateOnly(2017, 1, 1));

        var r = RerCalculadora.Calcular(new RerInput(new Money(req.IngresosMensuales)), parms);

        return Results.Ok(new
        {
            resultado = new { impuesto = r.Impuesto.Monto, tasaPct = r.TasaPct, superaTopeAnual = r.SuperaTopeAnual, moneda = "PEN" },
            desglose = new[]
            {
                new { concepto = "Ingresos netos mensuales", valor = req.IngresosMensuales },
                new { concepto = $"Impuesto ({r.TasaPct}%)", valor = r.Impuesto.Monto },
                new { concepto = "Proyección anual",         valor = r.ProyeccionAnual.Monto },
                new { concepto = "Tope anual RER",           valor = r.TopeAnual.Monto },
            },
            confianza = new { parametrosVersion = parms.Version, fuente = "Art. 120 TUO LIR",
                              disclaimer = "Cálculo referencial. Verifica con tu contador." },
        });
    }

    private static async Task<IResult> CalcularMype(
        MypeRequest req, IParametroService parametros,
        IValidator<MypeRequest> validator, CancellationToken ct)
    {
        var val = await validator.ValidateAsync(req, ct);
        if (!val.IsValid) return Results.ValidationProblem(val.ToDictionary());

        var parms = new ParametrosRmt(
            Uit:             await parametros.ObtenerMoneyAsync(ParametroClaves.UIT, ct: ct),
            Tramo1UITs:      await parametros.ObtenerDecimalAsync(ParametroClaves.RmtTramo1UITs,      ct: ct),
            Tramo1Pct:       await parametros.ObtenerDecimalAsync(ParametroClaves.RmtTramo1Pct,       ct: ct),
            Tramo2Pct:       await parametros.ObtenerDecimalAsync(ParametroClaves.RmtTramo2Pct,       ct: ct),
            PagosCuentaUITs: await parametros.ObtenerDecimalAsync(ParametroClaves.RmtPagosCuentaUits, ct: ct),
            PagosCuentaPct:  await parametros.ObtenerDecimalAsync(ParametroClaves.RmtPagosCuentaPct,  ct: ct),
            Version: DateOnly.FromDateTime(DateTime.Today).ToString("yyyy"),
            FechaActualizacion: new DateOnly(2017, 1, 1));

        var r = RmtCalculadora.Calcular(new RmtInput(new Money(req.IngresosNetos)), parms);

        return Results.Ok(new
        {
            resultado = new
            {
                pagoACuenta    = r.PagoACuenta.Monto,
                impuestoAnual  = r.ImpuestoAnual.Monto,
                pctPagoACuenta = r.PctPagoACuenta,
                moneda         = "PEN",
            },
            desglose = new[]
            {
                new { concepto = "Ingresos netos del mes",          valor = req.IngresosNetos },
                new { concepto = $"Pago a cuenta ({r.PctPagoACuenta}%)", valor = r.PagoACuenta.Monto },
                new { concepto = "Renta anual estimada",            valor = r.RentaAnualEstim.Monto },
                new { concepto = "Límite tramo 1 (15 UIT)",         valor = r.Tramo1Limite.Monto },
                new { concepto = "Impuesto tramo 1 (10%)",          valor = r.ImpuestoTramo1.Monto },
                new { concepto = "Impuesto tramo 2 (29.5%)",        valor = r.ImpuestoTramo2.Monto },
                new { concepto = "Impuesto anual estimado",         valor = r.ImpuestoAnual.Monto },
            },
            formula = "Renta ≤15 UIT: 10% | Exceso: 29.5% | Pago a cuenta: 1% si ≤300 UIT",
            confianza = new { parametrosVersion = parms.Version, fuente = "D.Leg. 1269",
                              disclaimer = "Cálculo referencial. Verifica con tu contador." },
        });
    }
}

public sealed record NrusRequest(decimal IngresosMensuales, decimal ComprasMensuales);
public sealed record RerRequest(decimal IngresosMensuales);
public sealed record MypeRequest(decimal IngresosNetos);

public sealed class NrusRequestValidator  : AbstractValidator<NrusRequest>  { public NrusRequestValidator()  { RuleFor(x => x.IngresosMensuales).GreaterThanOrEqualTo(0); RuleFor(x => x.ComprasMensuales).GreaterThanOrEqualTo(0); } }
public sealed class RerRequestValidator   : AbstractValidator<RerRequest>   { public RerRequestValidator()   { RuleFor(x => x.IngresosMensuales).GreaterThan(0); } }
public sealed class MypeRequestValidator  : AbstractValidator<MypeRequest>  { public MypeRequestValidator()  { RuleFor(x => x.IngresosNetos).GreaterThan(0); } }
