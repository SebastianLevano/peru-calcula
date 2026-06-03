using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Laboral;

/// <summary>
/// Calcula gratificación ordinaria (Ley 27735) y bonificación extraordinaria (Ley 29351).
///
/// Remuneración computable (Ley 27735, Art. 3):
///   RC = básico + asig.familiar + promedio de comisiones del semestre + otros bonos regulares
///   Nota: las horas extras NO integran la RC de gratificación (solo CTS), salvo que sean
///   percibidas regularmente por al menos 3 meses en el semestre.
///
/// Gratificación  = (RC / 6) × meses_completos + (RC / 180) × días_adicionales
/// Bonif.Ext.     = Gratificación × %EsSalud (o EPS), equivalente al aporte que el
///                  empleador se ahorra (Ley 29351).
/// </summary>
public static class GratificacionCalculadora
{
    public static GratificacionResultado Calcular(GratificacionInput input, ParametrosGratificacion parametros)
    {
        Validar(input);

        var asignacionFamiliar = input.TieneHijos
            ? (parametros.Rmv * (parametros.AsignacionFamiliarPct / 100m)).Redondear(RedondeoConcepto.Gratificacion)
            : new Money(0);

        var promedioComisiones = input.PromedioComisiones.Redondear(RedondeoConcepto.Gratificacion);
        var otrosBonos         = input.OtrosBonos.Redondear(RedondeoConcepto.Gratificacion);

        var rc = input.RemuneracionBasica + asignacionFamiliar + promedioComisiones + otrosBonos;

        var gratificacionMeses = (rc / 6m * input.MesesCompletados).Redondear(RedondeoConcepto.Gratificacion);
        var gratificacionDias  = (rc / 180m * input.DiasAdicionales).Redondear(RedondeoConcepto.Gratificacion);
        var gratificacion      = (gratificacionMeses + gratificacionDias).Redondear(RedondeoConcepto.Gratificacion);

        var pctBonif = input.AportaAEps ? parametros.EpsBonifPct : parametros.EssaludBonifPct;
        var bonificacionExtraordinaria = (gratificacion * (pctBonif / 100m)).Redondear(RedondeoConcepto.Gratificacion);

        return new GratificacionResultado(
            Gratificacion:              gratificacion,
            BonificacionExtraordinaria: bonificacionExtraordinaria,
            TotalDeposito:              (gratificacion + bonificacionExtraordinaria).Redondear(RedondeoConcepto.Gratificacion),
            RemuneracionComputable:     rc,
            AsignacionFamiliar:         asignacionFamiliar,
            PromedioComisiones:         promedioComisiones,
            OtrosBonos:                 otrosBonos,
            MesesCompletados:           input.MesesCompletados,
            DiasAdicionales:            input.DiasAdicionales,
            PctBonificacion:            pctBonif
        );
    }

    private static void Validar(GratificacionInput input)
    {
        if (input.RemuneracionBasica.Monto <= 0)
            throw new ArgumentException("La remuneración básica debe ser mayor a cero.");
        if (input.MesesCompletados < 0 || input.MesesCompletados > 6)
            throw new ArgumentException("Los meses deben estar entre 0 y 6.");
        if (input.DiasAdicionales < 0 || input.DiasAdicionales > 29)
            throw new ArgumentException("Los días adicionales deben estar entre 0 y 29.");
        if (input.PromedioComisiones.Monto < 0)
            throw new ArgumentException("El promedio de comisiones no puede ser negativo.");
        if (input.OtrosBonos.Monto < 0)
            throw new ArgumentException("Los otros bonos no pueden ser negativos.");
    }
}

public sealed record GratificacionInput(
    Money   RemuneracionBasica,
    bool    TieneHijos,
    int     MesesCompletados,
    int     DiasAdicionales,
    bool    AportaAEps         = false,
    Money   PromedioComisiones = default,   // promedio mensual de comisiones del semestre
    Money   OtrosBonos         = default    // promedio mensual de otros bonos regulares
);

public sealed record ParametrosGratificacion(
    Money    Rmv,
    decimal  AsignacionFamiliarPct,
    decimal  EssaludBonifPct,
    decimal  EpsBonifPct,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record GratificacionResultado(
    Money   Gratificacion,
    Money   BonificacionExtraordinaria,
    Money   TotalDeposito,
    Money   RemuneracionComputable,
    Money   AsignacionFamiliar,
    Money   PromedioComisiones,
    Money   OtrosBonos,
    int     MesesCompletados,
    int     DiasAdicionales,
    decimal PctBonificacion
);
