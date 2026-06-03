using System.Diagnostics.Metrics;

namespace PeruCalcula.Api.Telemetry;

/// <summary>
/// Métricas de negocio de Perú Calcula exportadas vía OTel (ADR-18).
/// North Star: calculaciones_completadas (ADR-21).
/// </summary>
public sealed class PeruCalculaMetrics : IDisposable
{
    public const string MeterName = "PeruCalcula";

    private readonly Meter _meter;

    // North Star (ADR-21)
    public readonly Counter<long> CalculacionesCompletadas;
    public readonly Counter<long> CalculacionesIniciadas;

    // Comparador
    public readonly Counter<long> ComparadorConsultas;

    // Analytics queue lag (observabilidad interna)
    public readonly ObservableGauge<int> AnalyticsQueueDepth;

    public PeruCalculaMetrics(IServiceProvider services)
    {
        _meter = new Meter(MeterName, "4.0.0");

        CalculacionesCompletadas = _meter.CreateCounter<long>(
            "perucalcula.calculaciones.completadas",
            description: "Número total de cálculos completados exitosamente");

        CalculacionesIniciadas = _meter.CreateCounter<long>(
            "perucalcula.calculaciones.iniciadas",
            description: "Número total de cálculos iniciados");

        ComparadorConsultas = _meter.CreateCounter<long>(
            "perucalcula.comparador.consultas",
            description: "Consultas al comparador de préstamos");

        // El Channel es un Singleton — lo resolvemos directamente desde DI
        AnalyticsQueueDepth = _meter.CreateObservableGauge<int>(
            "perucalcula.analytics_queue.depth",
            () =>
            {
                using var scope = services.CreateScope();
                // Intentamos leer el channel; si no está registrado devolvemos 0
                try
                {
                    var channel = scope.ServiceProvider.GetService<System.Threading.Channels.Channel<PeruCalcula.Shared.Contracts.AnalyticsEventoDto>>();
                    return channel?.Reader.Count ?? 0;
                }
                catch { return 0; }
            },
            description: "Eventos pendientes en la cola analytics");
    }

    public void Dispose() => _meter.Dispose();
}
