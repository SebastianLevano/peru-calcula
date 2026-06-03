using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Tributario;

/// <summary>
/// Calcula la cuota mensual del Nuevo RUS (D.Leg. 937).
/// Categoría 1: ingresos/compras mensuales ≤ S/5,000 → cuota S/20
/// Categoría 2: ingresos/compras mensuales ≤ S/8,000 → cuota S/50
/// Tope anual: S/96,000 (ingresos o compras).
/// </summary>
public static class NrusCalculadora
{
    public static NrusResultado Calcular(NrusInput input, ParametrosNrus parametros)
    {
        if (input.IngresosMensuales.Monto < 0)
            throw new ArgumentException("Los ingresos no pueden ser negativos.");

        var referencia = input.IngresosMensuales.Monto >= input.ComprasMensuales.Monto
            ? input.IngresosMensuales
            : input.ComprasMensuales;

        int categoria;
        Money cuota;
        string? alerta = null;

        if (referencia.Monto <= parametros.Cat1Tope.Monto)
        {
            categoria = 1;
            cuota     = parametros.Cat1Cuota;
        }
        else if (referencia.Monto <= parametros.Cat2Tope.Monto)
        {
            categoria = 2;
            cuota     = parametros.Cat2Cuota;
        }
        else
        {
            categoria = 0;   // no aplica NRUS
            cuota     = new Money(0);
            alerta    = $"Tus ingresos/compras superan el tope del NRUS (S/ {parametros.Cat2Tope.Monto:N0}/mes). Debes inscribirte en RER, RMT u otro régimen.";
        }

        var proyeccionAnual = referencia * 12m;
        if (categoria > 0 && proyeccionAnual.Monto > parametros.TopeAnual.Monto)
            alerta = $"Atención: tu proyección anual (S/ {proyeccionAnual.Monto:N0}) supera el tope anual del NRUS (S/ {parametros.TopeAnual.Monto:N0}).";

        return new NrusResultado(
            Categoria:         categoria,
            Cuota:             cuota,
            IngresosMensuales: input.IngresosMensuales,
            ComprasMensuales:  input.ComprasMensuales,
            ReferenciaMaxima:  referencia,
            ProyeccionAnual:   proyeccionAnual,
            TopeAnual:         parametros.TopeAnual,
            Alerta:            alerta
        );
    }
}

public static class MoneyExtensions
{
    public static Money Max(Money a, Money b) => a.Monto >= b.Monto ? a : b;
}

public sealed record NrusInput(
    Money IngresosMensuales,
    Money ComprasMensuales
);

public sealed record ParametrosNrus(
    Money    Cat1Tope,
    Money    Cat1Cuota,
    Money    Cat2Tope,
    Money    Cat2Cuota,
    Money    TopeAnual,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record NrusResultado(
    int     Categoria,
    Money   Cuota,
    Money   IngresosMensuales,
    Money   ComprasMensuales,
    Money   ReferenciaMaxima,
    Money   ProyeccionAnual,
    Money   TopeAnual,
    string? Alerta
);
