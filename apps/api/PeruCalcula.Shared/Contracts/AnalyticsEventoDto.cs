namespace PeruCalcula.Shared.Contracts;

public sealed record AnalyticsEventoDto(
    string TipoEvento,
    string CalculadoraSlug,
    string Modulo,
    string Dispositivo,
    string? ParametrosVersion = null
);
