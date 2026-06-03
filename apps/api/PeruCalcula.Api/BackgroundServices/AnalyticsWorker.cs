using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using PeruCalcula.Infrastructure.Persistence;
using PeruCalcula.Infrastructure.Persistence.Entities;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.BackgroundServices;

/// <summary>
/// Consume eventos del canal y los persiste en batch para no bloquear el request path (ADR-25).
/// </summary>
public sealed class AnalyticsWorker(
    Channel<AnalyticsEventoDto> channel,
    IServiceScopeFactory scopeFactory,
    ILogger<AnalyticsWorker> logger) : BackgroundService
{
    private const int BatchSize = 50;
    private const int FlushIntervalMs = 5_000;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var buffer = new List<AnalyticsEventoDto>(BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                cts.CancelAfter(FlushIntervalMs);

                while (buffer.Count < BatchSize)
                {
                    if (!await channel.Reader.WaitToReadAsync(cts.Token))
                        break;
                    if (channel.Reader.TryRead(out var ev))
                        buffer.Add(ev);
                }
            }
            catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
            {
                // flush interval alcanzado
            }

            if (buffer.Count > 0)
                await FlushAsync(buffer, stoppingToken);
        }

        // Vaciar lo que quede al apagar
        while (channel.Reader.TryRead(out var ev))
            buffer.Add(ev);
        if (buffer.Count > 0)
            await FlushAsync(buffer, CancellationToken.None);
    }

    private async Task FlushAsync(List<AnalyticsEventoDto> buffer, CancellationToken ct)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var entidades = buffer.Select(e => new AnalyticsEvento
            {
                TipoEvento       = e.TipoEvento,
                CalculadoraSlug  = e.CalculadoraSlug,
                Modulo           = e.Modulo,
                FechaUtc         = DateTimeOffset.UtcNow,
                Dispositivo      = e.Dispositivo,
                ParametrosVersion = e.ParametrosVersion,
            }).ToList();

            db.AnalyticsEventos.AddRange(entidades);
            await db.SaveChangesAsync(ct);

            logger.LogDebug("Analytics: {Count} eventos persistidos en batch", buffer.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al persistir batch de analytics ({Count} eventos)", buffer.Count);
        }
        finally
        {
            buffer.Clear();
        }
    }
}

public sealed class AnalyticsQueue(Channel<AnalyticsEventoDto> channel) : IAnalyticsQueue
{
    public void Encolar(AnalyticsEventoDto evento) =>
        channel.Writer.TryWrite(evento);
}
