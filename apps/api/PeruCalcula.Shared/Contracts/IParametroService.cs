namespace PeruCalcula.Shared.Contracts;

public interface IParametroService
{
    Task<decimal> ObtenerDecimalAsync(string clave, DateOnly? fecha = null, CancellationToken ct = default);
    Task<Money> ObtenerMoneyAsync(string clave, DateOnly? fecha = null, CancellationToken ct = default);
    void InvalidarCache();
}
