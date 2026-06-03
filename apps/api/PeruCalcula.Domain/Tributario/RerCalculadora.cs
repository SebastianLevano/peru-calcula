using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Tributario;

/// <summary>
/// Calcula el pago mensual del Régimen Especial (RER). Art. 120 TUO LIR.
/// Impuesto = 1.5% de los ingresos netos mensuales.
/// Tope anual: S/525,000 de ingresos netos.
/// </summary>
public static class RerCalculadora
{
    public static RerResultado Calcular(RerInput input, ParametrosRer parametros)
    {
        if (input.IngresosMensuales.Monto < 0)
            throw new ArgumentException("Los ingresos no pueden ser negativos.");

        var impuesto = (input.IngresosMensuales * (parametros.TasaPct / 100m))
            .Redondear(RedondeoConcepto.General);

        var proyeccionAnual = input.IngresosMensuales * 12m;
        bool superaTopeAnual = proyeccionAnual.Monto > parametros.TopeAnual.Monto;

        return new RerResultado(
            Impuesto:          impuesto,
            IngresosMensuales: input.IngresosMensuales,
            TasaPct:           parametros.TasaPct,
            ProyeccionAnual:   proyeccionAnual,
            TopeAnual:         parametros.TopeAnual,
            SuperaTopeAnual:   superaTopeAnual
        );
    }
}

public sealed record RerInput(Money IngresosMensuales);

public sealed record ParametrosRer(
    decimal  TasaPct,
    Money    TopeAnual,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record RerResultado(
    Money   Impuesto,
    Money   IngresosMensuales,
    decimal TasaPct,
    Money   ProyeccionAnual,
    Money   TopeAnual,
    bool    SuperaTopeAnual
);
