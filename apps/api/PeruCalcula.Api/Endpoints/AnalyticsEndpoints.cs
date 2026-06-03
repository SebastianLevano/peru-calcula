using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.Endpoints;

public static class AnalyticsEndpoints
{
    public static IEndpointRouteBuilder MapAnalytics(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/analytics").WithTags("Analytics");

        group.MapPost("/evento", RegistrarEvento)
             .WithName("RegistrarEvento")
             .WithSummary("Registra evento de analítica (fire-and-forget, sin PII)");

        return app;
    }

    private static IResult RegistrarEvento(
        AnalyticsEventoRequest req,
        IAnalyticsQueue queue)
    {
        if (string.IsNullOrWhiteSpace(req.TipoEvento)
         || string.IsNullOrWhiteSpace(req.CalculadoraSlug)
         || string.IsNullOrWhiteSpace(req.Modulo))
            return Results.BadRequest(new { error = "Campos requeridos faltantes." });

        var dispositivo = req.Dispositivo?.ToLowerInvariant() switch
        {
            "mobile" or "tablet" or "desktop" => req.Dispositivo.ToLowerInvariant(),
            _ => "desktop",
        };

        queue.Encolar(new AnalyticsEventoDto(
            TipoEvento:       req.TipoEvento,
            CalculadoraSlug:  req.CalculadoraSlug,
            Modulo:           req.Modulo,
            Dispositivo:      dispositivo,
            ParametrosVersion: req.ParametrosVersion
        ));

        return Results.Accepted();
    }
}

public sealed record AnalyticsEventoRequest(
    string  TipoEvento,
    string  CalculadoraSlug,
    string  Modulo,
    string? Dispositivo,
    string? ParametrosVersion
);
