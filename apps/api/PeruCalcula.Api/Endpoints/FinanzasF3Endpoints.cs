using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PeruCalcula.Domain.Finanzas;
using PeruCalcula.Infrastructure.Persistence;
using PeruCalcula.Shared;

namespace PeruCalcula.Api.Endpoints;

public static class FinanzasF3Endpoints
{
    public static IEndpointRouteBuilder MapFinanzasF3(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/finanzas").WithTags("Finanzas");

        // Comparador TCEA (ADR-17: ranking vs patrocinados)
        group.MapGet("/comparador", Comparar)
             .WithName("ComparadorPrestamos")
             .WithSummary("Compara productos financieros por TCEA para monto y plazo dados");

        // Catálogo público de bancos activos
        group.MapGet("/bancos", GetBancos)
             .WithName("GetBancos")
             .WithSummary("Devuelve bancos activos con sus productos");

        // Calculadoras standalone vehicular e hipotecario
        group.MapPost("/credito-vehicular", CalcularVehicular)
             .WithName("CalcularCreditoVehicular")
             .WithSummary("Calcula cuota y cronograma de crédito vehicular (sistema francés)");

        group.MapPost("/credito-hipotecario", CalcularHipotecario)
             .WithName("CalcularCreditoHipotecario")
             .WithSummary("Calcula cuota y cronograma de crédito hipotecario (sistema francés)");

        return app;
    }

    // ── Comparador ────────────────────────────────────────────────────────────

    private static async Task<IResult> Comparar(
        string  tipo,        // personal | vehicular | hipotecario
        decimal monto,
        int     plazo,
        AppDbContext db,
        CancellationToken ct)
    {
        tipo = tipo.ToLowerInvariant();
        if (tipo is not ("personal" or "vehicular" or "hipotecario"))
            return Results.Problem("El tipo debe ser 'personal', 'vehicular' o 'hipotecario'.", statusCode: 400);
        if (monto <= 0)
            return Results.Problem("El monto debe ser mayor a cero.", statusCode: 400);
        if (plazo <= 0 || plazo > 480)
            return Results.Problem("El plazo debe estar entre 1 y 480 meses.", statusCode: 400);

        // Carga productos activos con tasa vigente más reciente
        var productos = await db.ProductosFinancieros
            .Include(p => p.Banco)
            .Include(p => p.Tasas.Where(t => t.VigenciaHasta == null || t.VigenciaHasta >= DateOnly.FromDateTime(DateTime.UtcNow)))
            .Where(p => p.Activo && p.Tipo == tipo && p.Banco.Activo)
            .OrderBy(p => p.Banco.Orden)
            .ToListAsync(ct);

        var resultados = new List<object>();

        foreach (var prod in productos)
        {
            var tasa = prod.Tasas
                .OrderByDescending(t => t.VigenciaDesde)
                .FirstOrDefault();

            if (tasa is null) continue;

            try
            {
                var calc = ComparadorCalculadora.Calcular(new ComparadorInput(
                    Monto:                monto,
                    PlazoMeses:           plazo,
                    Tea:                  tasa.Tea,
                    ComisionAdminMensual: tasa.ComisionAdmin ?? 0m
                ));

                resultados.Add(new
                {
                    productoId    = prod.Id,
                    banco = new
                    {
                        id           = prod.Banco.Id,
                        nombre       = prod.Banco.Nombre,
                        slug         = prod.Banco.Slug,
                        logoUrl      = prod.Banco.LogoUrl,
                        urlAfiliado  = prod.Banco.UrlAfiliado,
                        esPatrocinado = prod.Banco.EsPatrocinado,
                    },
                    producto      = prod.Nombre,
                    moneda        = prod.Moneda,
                    tea           = Math.Round(tasa.Tea * 100, 2),
                    tcea          = Math.Round(calc.Tcea * 100, 2),
                    tceaRef       = tasa.EsReferencial,
                    cuota         = calc.Cuota.Monto,
                    comisionMensual = calc.ComisionMensual.Monto,
                    flujoMensual  = calc.FlujoMensual.Monto,
                    totalPagado   = calc.TotalPagado.Monto,
                    totalIntereses = calc.TotalIntereses.Monto,
                    totalComisiones = calc.TotalComisiones.Monto,
                    fuente        = tasa.Fuente,
                    vigenciaDesde = tasa.VigenciaDesde,
                });
            }
            catch
            {
                // Producto con tasa inválida para este monto/plazo — se omite
            }
        }

        // ADR-17: separar ranking (no patrocinados, orden por TCEA) de patrocinados
        var ranking = resultados
            .Where(r => !(bool)((dynamic)r).banco.esPatrocinado)
            .OrderBy(r => (decimal)((dynamic)r).tcea)
            .ToList();

        var patrocinados = resultados
            .Where(r => (bool)((dynamic)r).banco.esPatrocinado)
            .ToList();

        return Results.Ok(new
        {
            tipo,
            monto,
            plazo,
            ranking,
            patrocinados,
            divulgacion = "Los resultados están ordenados de menor a mayor TCEA. Los productos 'Patrocinados' aparecen en sección separada — podemos recibir una comisión si contratas a través de nuestro enlace. La TCEA es referencial y puede variar según el perfil crediticio del solicitante.",
            fechaConsulta = DateTime.UtcNow.ToString("yyyy-MM-dd"),
        });
    }

    // ── Catálogo bancos ───────────────────────────────────────────────────────

    private static async Task<IResult> GetBancos(AppDbContext db, CancellationToken ct)
    {
        var bancos = await db.Bancos
            .Include(b => b.Productos.Where(p => p.Activo))
            .Where(b => b.Activo)
            .OrderBy(b => b.Orden)
            .ToListAsync(ct);

        return Results.Ok(bancos.Select(b => new
        {
            id       = b.Id,
            nombre   = b.Nombre,
            slug     = b.Slug,
            logoUrl  = b.LogoUrl,
            sitioUrl = b.SitioUrl,
            productos = b.Productos.Select(p => new
            {
                id     = p.Id,
                nombre = p.Nombre,
                tipo   = p.Tipo,
                moneda = p.Moneda,
            }),
        }));
    }

    // ── Crédito Vehicular ─────────────────────────────────────────────────────

    private static async Task<IResult> CalcularVehicular(
        CreditoVehicularRequest req,
        IValidator<CreditoVehicularRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(req, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(req.Monto), req.PlazoMeses, req.Tea / 100m));

        return Results.Ok(BuildCreditoResponse(resultado, req.Monto, req.PlazoMeses, req.Tea,
            "Crédito vehicular", "Calculadora CTS vehicular — tasa ingresada manualmente."));
    }

    // ── Crédito Hipotecario ───────────────────────────────────────────────────

    private static async Task<IResult> CalcularHipotecario(
        CreditoHipotecarioRequest req,
        IValidator<CreditoHipotecarioRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(req, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var resultado = CreditoPersonalCalculadora.Calcular(
            new CreditoPersonalInput(new Money(req.Monto), req.PlazoMeses, req.Tea / 100m));

        return Results.Ok(BuildCreditoResponse(resultado, req.Monto, req.PlazoMeses, req.Tea,
            "Crédito hipotecario", "Cálculo referencial. El banco puede ajustar tasas según perfil y garantía."));
    }

    private static object BuildCreditoResponse(
        CreditoPersonalResultado resultado,
        decimal monto, int plazo, decimal tea,
        string tipo, string disclaimer)
    {
        return new
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
                new { concepto = "Monto del crédito", valor = monto },
                new { concepto = "Plazo (meses)",      valor = (decimal)plazo },
                new { concepto = "TEA (%)",             valor = tea },
                new { concepto = "TEM (%)",             valor = Math.Round(resultado.Tem * 100, 4) },
                new { concepto = "Cuota mensual",       valor = resultado.Cuota.Monto },
                new { concepto = "Total a pagar",       valor = resultado.TotalPagado.Monto },
                new { concepto = "Total intereses",     valor = resultado.TotalIntereses.Monto },
            },
            cronograma = resultado.Cronograma.Select(c => new
            {
                mes          = c.Numero,
                cuota        = c.Cuota.Monto,
                interes      = c.Interes.Monto,
                amortizacion = c.Amortizacion.Monto,
                saldo        = c.Saldo.Monto,
            }),
            formula   = "cuota = P·i·(1+i)^n / ((1+i)^n − 1)  |  i = TEM = (1+TEA)^(1/12) − 1",
            confianza = new
            {
                parametrosVersion           = "N/A",
                fechaActualizacionNormativa = (string?)null,
                fuente                      = tipo,
                disclaimer,
            },
        };
    }
}

// ── Requests & Validators ─────────────────────────────────────────────────────

public sealed record CreditoVehicularRequest(decimal Monto, int PlazoMeses, decimal Tea);
public sealed record CreditoHipotecarioRequest(decimal Monto, int PlazoMeses, decimal Tea);

public sealed class CreditoVehicularRequestValidator : AbstractValidator<CreditoVehicularRequest>
{
    public CreditoVehicularRequestValidator()
    {
        RuleFor(x => x.Monto).GreaterThan(0);
        RuleFor(x => x.PlazoMeses).InclusiveBetween(1, 84);   // máx 7 años
        RuleFor(x => x.Tea).GreaterThanOrEqualTo(0).LessThanOrEqualTo(1000);
    }
}

public sealed class CreditoHipotecarioRequestValidator : AbstractValidator<CreditoHipotecarioRequest>
{
    public CreditoHipotecarioRequestValidator()
    {
        RuleFor(x => x.Monto).GreaterThan(0);
        RuleFor(x => x.PlazoMeses).InclusiveBetween(12, 360); // 1 a 30 años
        RuleFor(x => x.Tea).GreaterThanOrEqualTo(0).LessThanOrEqualTo(100);
    }
}
