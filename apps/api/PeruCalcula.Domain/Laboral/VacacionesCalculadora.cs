using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Laboral;

/// <summary>
/// Calcula vacaciones según el D.Leg. 713.
/// Vacaciones ordinarias:   30 días = remuneración mensual computable.
/// Vacaciones truncas:      RC / 12 * meses_trabajados (cuando < 1 año y se liquida).
/// Vacaciones pendientes:   días no gozados * (RC / 30).
/// </summary>
public static class VacacionesCalculadora
{
    public static VacacionesResultado Calcular(VacacionesInput input, ParametrosVacaciones parametros)
    {
        if (input.RemuneracionMensual.Monto <= 0)
            throw new ArgumentException("La remuneración debe ser mayor a cero.");

        var asignacionFamiliar = input.TieneHijos
            ? (parametros.Rmv * (parametros.AsignacionFamiliarPct / 100m)).Redondear(RedondeoConcepto.Vacaciones)
            : new Money(0);

        var rc = input.RemuneracionMensual + asignacionFamiliar;

        Money vacOrdinarias    = new(0);
        Money vacTruncas       = new(0);
        Money vacPendientes    = new(0);

        // Vacaciones ordinarias: 1 año completo trabajado → 30 días = RC mensual
        if (input.AniosCompletados >= 1)
            vacOrdinarias = rc.Redondear(RedondeoConcepto.Vacaciones);

        // Vacaciones truncas: < 1 año → RC/12 * meses (al liquidar)
        if (input.MesesTruncos > 0)
            vacTruncas = (rc / 12m * input.MesesTruncos).Redondear(RedondeoConcepto.Vacaciones);

        // Vacaciones pendientes (días no gozados * RC/30)
        if (input.DiasPendientes > 0)
            vacPendientes = (rc / 30m * input.DiasPendientes).Redondear(RedondeoConcepto.Vacaciones);

        var total = (vacOrdinarias + vacTruncas + vacPendientes).Redondear(RedondeoConcepto.Vacaciones);

        return new VacacionesResultado(
            VacacionesOrdinarias: vacOrdinarias,
            VacacionesTruncas:    vacTruncas,
            VacacionesPendientes: vacPendientes,
            Total:                total,
            RemuneracionComputable: rc,
            AsignacionFamiliar:   asignacionFamiliar
        );
    }
}

public sealed record VacacionesInput(
    Money RemuneracionMensual,
    bool  TieneHijos,
    int   AniosCompletados,
    int   MesesTruncos   = 0,
    int   DiasPendientes = 0
);

public sealed record ParametrosVacaciones(
    Money   Rmv,
    decimal AsignacionFamiliarPct,
    string  Version,
    DateOnly FechaActualizacion
);

public sealed record VacacionesResultado(
    Money VacacionesOrdinarias,
    Money VacacionesTruncas,
    Money VacacionesPendientes,
    Money Total,
    Money RemuneracionComputable,
    Money AsignacionFamiliar
);
