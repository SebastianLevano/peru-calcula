using Microsoft.EntityFrameworkCore;
using PeruCalcula.Infrastructure.Persistence;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Api.BackgroundServices;

/// <summary>
/// Ejecuta el rollup diario de analytics_eventos → analytics_rollups_diarios.
/// Se dispara una vez al día (a las 02:00 UTC) y aplica TTL a eventos crudos (ADR-33).
/// </summary>
public sealed class RollupWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<RollupWorker> logger) : BackgroundService
{
    private static readonly TimeSpan TtlEventosCrudos = TimeSpan.FromDays(90);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var ahora   = DateTime.UtcNow;
            var proxima = ahora.Date.AddDays(1).AddHours(2);   // 02:00 UTC del día siguiente
            var espera  = proxima - ahora;

            logger.LogInformation("RollupWorker: próxima ejecución en {Espera:hh\\:mm}", espera);
            await Task.Delay(espera, stoppingToken);

            await EjecutarAsync(stoppingToken);
        }
    }

    private async Task EjecutarAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var ayer = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
            await AgregarDiaAsync(db, ayer, ct);

            // TTL: eliminar eventos crudos más antiguos que el umbral (ADR-33)
            var limiteEliminacion = DateTimeOffset.UtcNow - TtlEventosCrudos;
            var eliminados = await db.AnalyticsEventos
                .Where(e => e.FechaUtc < limiteEliminacion)
                .ExecuteDeleteAsync(ct);

            if (eliminados > 0)
                logger.LogInformation("RollupWorker: {Eliminados} eventos crudos eliminados (TTL)", eliminados);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RollupWorker: error durante la ejecución");
        }
    }

    private static async Task AgregarDiaAsync(AppDbContext db, DateOnly fecha, CancellationToken ct)
    {
        var eventos = await db.AnalyticsEventos
            .Where(e => DateOnly.FromDateTime(e.FechaUtc.DateTime) == fecha)
            .GroupBy(e => new { e.CalculadoraSlug, e.Modulo })
            .Select(g => new
            {
                g.Key.CalculadoraSlug,
                g.Key.Modulo,
                Inicios      = g.Count(e => e.TipoEvento == "inicio"),
                Completados  = g.Count(e => e.TipoEvento == "completado"),
                ExportPdf    = g.Count(e => e.TipoEvento == "export_pdf"),
                Clicks       = g.Count(e => e.TipoEvento == "click_afiliado"),
            })
            .ToListAsync(ct);

        foreach (var fila in eventos)
        {
            var existente = await db.AnalyticsRollupsDiarios
                .FirstOrDefaultAsync(r => r.Fecha == fecha
                                       && r.CalculadoraSlug == fila.CalculadoraSlug, ct);
            if (existente is not null)
            {
                existente.Inicios       = fila.Inicios;
                existente.Completados   = fila.Completados;
                existente.ExportPdf     = fila.ExportPdf;
                existente.ClicksAfiliado = fila.Clicks;
            }
            else
            {
                db.AnalyticsRollupsDiarios.Add(new AnalyticsRollupDiario
                {
                    Fecha           = fecha,
                    CalculadoraSlug = fila.CalculadoraSlug,
                    Modulo          = fila.Modulo,
                    Inicios         = fila.Inicios,
                    Completados     = fila.Completados,
                    ExportPdf       = fila.ExportPdf,
                    ClicksAfiliado  = fila.Clicks,
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
