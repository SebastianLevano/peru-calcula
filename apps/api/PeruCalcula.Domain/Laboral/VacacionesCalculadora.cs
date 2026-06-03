using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Laboral;

/// <summary>
/// Calcula vacaciones según el D.Leg. 713 / D.S. 012-92-TR.
///
/// Remuneración computable (Art. 12 D.S. 012-92-TR):
///   RC = básico + asig. familiar + promedio mensual remuneraciones variables (últimos 12 meses)
///   No incluye 1/6 de gratificación (diferencia clave con CTS).
///
/// Vacaciones ordinarias:  30 días = RC mensual (1 año completo trabajado).
/// Vacaciones truncas:     RC/12 × meses + RC/360 × días (al cesar antes del año).
/// Vacaciones pendientes:  RC/30 × días no gozados de períodos anteriores.
/// </summary>
public static class VacacionesCalculadora
{
    public static VacacionesResultado Calcular(VacacionesInput input, ParametrosVacaciones parametros)
    {
        if (input.RemuneracionBasica.Monto <= 0)
            throw new ArgumentException("La remuneración básica debe ser mayor a cero.");

        var asignacionFamiliar   = input.TieneHijos
            ? (parametros.Rmv * (parametros.AsignacionFamiliarPct / 100m)).Redondear(RedondeoConcepto.Vacaciones)
            : new Money(0);

        var promedioHorasExtras  = input.PromedioHorasExtras.Redondear(RedondeoConcepto.Vacaciones);
        var promedioComisiones   = input.PromedioComisiones.Redondear(RedondeoConcepto.Vacaciones);
        var otrosBonos           = input.OtrosBonos.Redondear(RedondeoConcepto.Vacaciones);

        var rc = input.RemuneracionBasica
               + asignacionFamiliar
               + promedioHorasExtras
               + promedioComisiones
               + otrosBonos;

        Money vacOrdinarias  = new(0);
        Money vacTruncas     = new(0);
        Money vacPendientes  = new(0);

        // Con ≥ 30 días de falta en el año, el trabajador pierde el derecho vacacional (D.Leg. 713 Art. 11)
        bool pierdeOrdinarias = input.DiasFaltasAnio >= 30;

        if (input.AniosCompletados >= 1 && !pierdeOrdinarias)
            vacOrdinarias = rc.Redondear(RedondeoConcepto.Vacaciones);

        if (input.MesesTruncos > 0 || input.DiasAdicionalesTruncos > 0)
        {
            // Descuenta faltas del período trunco
            int diasTruncosTotales   = input.MesesTruncos * 30 + input.DiasAdicionalesTruncos;
            int diasTruncosEfectivos = Math.Max(0, diasTruncosTotales - input.DiasFaltasAnio);
            int mesesEf = diasTruncosEfectivos / 30;
            int diasEf  = diasTruncosEfectivos % 30;

            var porMeses = (rc / 12m * mesesEf).Redondear(RedondeoConcepto.Vacaciones);
            var porDias  = (rc / 360m * diasEf).Redondear(RedondeoConcepto.Vacaciones);
            vacTruncas   = (porMeses + porDias).Redondear(RedondeoConcepto.Vacaciones);
        }

        if (input.DiasPendientes > 0)
            vacPendientes = (rc / 30m * input.DiasPendientes).Redondear(RedondeoConcepto.Vacaciones);

        var total = (vacOrdinarias + vacTruncas + vacPendientes).Redondear(RedondeoConcepto.Vacaciones);

        return new VacacionesResultado(
            VacacionesOrdinarias:   vacOrdinarias,
            VacacionesTruncas:      vacTruncas,
            VacacionesPendientes:   vacPendientes,
            Total:                  total,
            RemuneracionComputable: rc,
            AsignacionFamiliar:     asignacionFamiliar,
            PromedioHorasExtras:    promedioHorasExtras,
            PromedioComisiones:     promedioComisiones,
            OtrosBonos:             otrosBonos,
            PierdeDerechoOrdinarias: pierdeOrdinarias
        );
    }
}

public sealed record VacacionesInput(
    Money RemuneracionBasica,
    bool  TieneHijos,
    int   AniosCompletados,
    int   MesesTruncos           = 0,
    int   DiasPendientes         = 0,
    int   DiasAdicionalesTruncos = 0,
    Money PromedioHorasExtras    = default,
    Money PromedioComisiones     = default,
    Money OtrosBonos             = default,
    int   DiasFaltasAnio         = 0     // faltas en el año: ≥ 30 → pierde derecho vacacional (D.Leg. 713 Art. 11)
);

public sealed record ParametrosVacaciones(
    Money    Rmv,
    decimal  AsignacionFamiliarPct,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record VacacionesResultado(
    Money VacacionesOrdinarias,
    Money VacacionesTruncas,
    Money VacacionesPendientes,
    Money Total,
    Money RemuneracionComputable,
    Money AsignacionFamiliar,
    Money PromedioHorasExtras,
    Money PromedioComisiones,
    Money OtrosBonos,
    bool  PierdeDerechoOrdinarias   // true si DiasFaltasAnio >= 30 (D.Leg. 713 Art. 11)
);
