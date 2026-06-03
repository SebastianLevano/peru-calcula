using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PeruCalcula.Infrastructure.Persistence;
using PeruCalcula.Shared;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Infrastructure;

public sealed class ParametroService(AppDbContext db, IMemoryCache cache) : IParametroService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);
    private const string CacheKeyPrefix = "param:";

    public async Task<decimal> ObtenerDecimalAsync(string clave, DateOnly? fecha = null, CancellationToken ct = default)
    {
        var valor = await ObtenerValorAsync(clave, fecha, ct);
        return decimal.Parse(valor, System.Globalization.CultureInfo.InvariantCulture);
    }

    public async Task<Money> ObtenerMoneyAsync(string clave, DateOnly? fecha = null, CancellationToken ct = default)
    {
        var param = await ObtenerParametroAsync(clave, fecha, ct);
        var monto = decimal.Parse(param.valor, System.Globalization.CultureInfo.InvariantCulture);
        var moneda = Enum.TryParse<MonedaIso>(param.moneda, out var m) ? m : MonedaIso.PEN;
        return new Money(monto, moneda);
    }

    public void InvalidarCache()
    {
        // La invalidación selectiva de IMemoryCache requiere keys trackeados.
        // Para F0/F1 con admin de un solo operador, limpiamos toda la sección de parámetros
        // mediante un tag/key de generación que se incrementa.
        _cacheGeneration++;
    }

    private static int _cacheGeneration = 0;

    private string BuildKey(string clave, DateOnly fecha) =>
        $"{CacheKeyPrefix}{_cacheGeneration}:{clave}:{fecha:yyyy-MM-dd}";

    private async Task<string> ObtenerValorAsync(string clave, DateOnly? fecha, CancellationToken ct)
    {
        var (valor, _) = await ObtenerParametroAsync(clave, fecha, ct);
        return valor;
    }

    private async Task<(string valor, string? moneda)> ObtenerParametroAsync(string clave, DateOnly? fecha, CancellationToken ct)
    {
        var efectiva = fecha ?? DateOnly.FromDateTime(DateTime.Today);
        var key = BuildKey(clave, efectiva);

        if (cache.TryGetValue(key, out (string valor, string? moneda) cached))
            return cached;

        var param = await db.Parametros
            .Where(p => p.Clave == clave
                     && p.VigenciaDesde <= efectiva
                     && (p.VigenciaHasta == null || p.VigenciaHasta >= efectiva))
            .OrderByDescending(p => p.VigenciaDesde)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"Parámetro '{clave}' no encontrado para la fecha {efectiva}.");

        var result = (param.Valor, param.Moneda);
        cache.Set(key, result, CacheDuration);
        return result;
    }
}
