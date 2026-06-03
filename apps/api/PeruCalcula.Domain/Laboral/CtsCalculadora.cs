using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Laboral;

/// <summary>
/// Calcula la CTS semestral según D.Leg. 650.
///
/// Remuneración computable (Art. 9 D.Leg. 650):
///   RC = básico + asig.familiar + 1/6 de la última gratificación recibida
///        + promedio mensual horas extras (últimos 6 meses)
///        + promedio mensual comisiones (últimos 6 meses)
///        + promedio otros bonos regulares (últimos 6 meses)
///
/// CTS = (RC/12) × meses_efectivos + (RC/360) × días_efectivos
/// Los días de inasistencia injustificada (DiasFaltas) se descuentan del período computable
/// (Art. 18 D.Leg. 650).
/// </summary>
public static class CtsCalculadora
{
    public static CtsResultado Calcular(CtsInput input, ParametrosCts parametros)
    {
        ValidarInput(input);

        // 1. Componentes de la remuneración computable
        var asignacionFamiliar = input.TieneHijos
            ? (parametros.Rmv * (parametros.AsignacionFamiliarPct / 100m)).Redondear(RedondeoConcepto.CTS)
            : new Money(0);

        // 1/6 de la última grati recibida; si no se conoce, se aproxima con básico/6
        var baseGratificacion  = input.UltimaGratificacion.Monto > 0
            ? input.UltimaGratificacion
            : input.RemuneracionBasica;
        var sextaGratificacion  = (baseGratificacion * (1m / 6m)).Redondear(RedondeoConcepto.CTS);
        var promedioHorasExtras = input.PromedioHorasExtras.Redondear(RedondeoConcepto.CTS);
        var promedioComisiones  = input.PromedioComisiones.Redondear(RedondeoConcepto.CTS);
        var otrosBonos          = input.OtrosBonos.Redondear(RedondeoConcepto.CTS);

        var rc = input.RemuneracionBasica
               + asignacionFamiliar
               + sextaGratificacion
               + promedioHorasExtras
               + promedioComisiones
               + otrosBonos;

        // 2. Período efectivo (descuenta inasistencias injustificadas)
        int meses = Math.Min(input.MesesCompletados, 6);
        int dias  = Math.Min(input.DiasAdicionales, 29);

        int totalDias          = meses * 30 + dias;
        int totalDiasEfectivos = Math.Max(0, totalDias - input.DiasFaltas);
        int mesesEfectivos     = totalDiasEfectivos / 30;
        int diasEfectivos      = totalDiasEfectivos % 30;

        // 3. Monto CTS
        var ctsMeses = (rc / 12m * mesesEfectivos).Redondear(RedondeoConcepto.CTS);
        var ctsDias  = (rc / 360m * diasEfectivos).Redondear(RedondeoConcepto.CTS);
        var totalCts = (ctsMeses + ctsDias).Redondear(RedondeoConcepto.CTS);

        return new CtsResultado(
            MontoFinal:              totalCts,
            RemuneracionComputable:  rc,
            AsignacionFamiliar:      asignacionFamiliar,
            SextaGratificacion:      sextaGratificacion,
            PromedioHorasExtras:     promedioHorasExtras,
            PromedioComisiones:      promedioComisiones,
            OtrosBonos:              otrosBonos,
            MesesCompletados:        mesesEfectivos,
            DiasAdicionales:         diasEfectivos,
            DiasFaltas:              input.DiasFaltas,
            CtsMeses:                ctsMeses,
            CtsDias:                 ctsDias
        );
    }

    private static void ValidarInput(CtsInput input)
    {
        if (input.RemuneracionBasica.Monto <= 0)
            throw new ArgumentException("La remuneración básica debe ser mayor a cero.");
        if (input.MesesCompletados < 0 || input.MesesCompletados > 6)
            throw new ArgumentException("Los meses completados deben estar entre 0 y 6.");
        if (input.DiasAdicionales < 0 || input.DiasAdicionales > 29)
            throw new ArgumentException("Los días adicionales deben estar entre 0 y 29.");
        if (input.PromedioHorasExtras.Monto < 0)
            throw new ArgumentException("El promedio de horas extras no puede ser negativo.");
        if (input.PromedioComisiones.Monto < 0)
            throw new ArgumentException("El promedio de comisiones no puede ser negativo.");
        if (input.OtrosBonos.Monto < 0)
            throw new ArgumentException("Los otros bonos no pueden ser negativos.");
        if (input.DiasFaltas < 0)
            throw new ArgumentException("Los días de falta no pueden ser negativos.");
    }
}

public sealed record CtsInput(
    Money RemuneracionBasica,
    bool  TieneHijos,
    int   MesesCompletados,
    int   DiasAdicionales,
    Money UltimaGratificacion = default,   // monto real de la última grati recibida; si 0, se aproxima con básico/6
    Money PromedioHorasExtras = default,   // promedio mensual de HH.EE. de los últimos 6 meses
    Money PromedioComisiones  = default,   // promedio mensual de comisiones del semestre
    Money OtrosBonos          = default,   // promedio mensual de otros bonos regulares
    int   DiasFaltas          = 0          // días de inasistencia injustificada del semestre (Art. 18 D.Leg. 650)
);

public sealed record ParametrosCts(
    Money    Rmv,
    decimal  AsignacionFamiliarPct,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record CtsResultado(
    Money MontoFinal,
    Money RemuneracionComputable,
    Money AsignacionFamiliar,
    Money SextaGratificacion,
    Money PromedioHorasExtras,
    Money PromedioComisiones,
    Money OtrosBonos,
    int   MesesCompletados,
    int   DiasAdicionales,
    int   DiasFaltas,
    Money CtsMeses,
    Money CtsDias
);
