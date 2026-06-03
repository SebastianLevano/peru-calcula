using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Tributario;

/// <summary>
/// Calcula retención de 4ta categoría (Art. 74 TUO LIR).
/// Retención = 8% si el recibo > umbral mensual.
/// Suspensión: si proyección anual de ingresos 4ta &lt; 7 UIT, puede solicitar suspensión a SUNAT.
/// </summary>
public static class RecibosHonorariosCalculadora
{
    public static RecibosResultado Calcular(RecibosInput input, ParametrosRecibos parametros)
    {
        if (input.MontoRecibo.Monto <= 0)
            throw new ArgumentException("El monto del recibo debe ser mayor a cero.");

        bool aplicaRetencion = input.MontoRecibo.Monto > parametros.UmbralMensual.Monto;

        var montoRetencion = aplicaRetencion
            ? (input.MontoRecibo * (parametros.TasaRetencionPct / 100m)).Redondear(RedondeoConcepto.Retencion4ta)
            : new Money(0);

        var montoNeto = (input.MontoRecibo - montoRetencion).Redondear(RedondeoConcepto.Retencion4ta);

        // Proyección anual para evaluación de suspensión (Art. 45 Rgto LIR)
        var proyeccionAnual = input.MontoRecibo * 12m;
        var limiteExencion  = parametros.Uit * 7m;    // 7 UIT → exento de retención mensual
        bool calificaSuspension = proyeccionAnual.Monto <= limiteExencion.Monto;

        return new RecibosResultado(
            MontoRecibo:         input.MontoRecibo,
            AplicaRetencion:     aplicaRetencion,
            MontoRetencion:      montoRetencion,
            MontoNeto:           montoNeto,
            TasaRetencionPct:    parametros.TasaRetencionPct,
            ProyeccionAnual:     proyeccionAnual,
            LimiteExencion:      limiteExencion,
            CalificaSuspension:  calificaSuspension
        );
    }
}

public sealed record RecibosInput(Money MontoRecibo);

public sealed record ParametrosRecibos(
    decimal  TasaRetencionPct,
    Money    UmbralMensual,
    Money    Uit,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record RecibosResultado(
    Money   MontoRecibo,
    bool    AplicaRetencion,
    Money   MontoRetencion,
    Money   MontoNeto,
    decimal TasaRetencionPct,
    Money   ProyeccionAnual,
    Money   LimiteExencion,
    bool    CalificaSuspension
);
