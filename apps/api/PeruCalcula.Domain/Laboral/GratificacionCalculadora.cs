using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Laboral;

/// <summary>
/// Calcula gratificación ordinaria de julio y diciembre (Ley 27735).
/// Monto = (RC / 6) * meses_computable
/// Bonificación extraordinaria = 9% de la gratificación si el trabajador aporta a EsSalud,
///                               6.75% si aporta a EPS.
/// La bonificación extraordinaria equivale al aporte de EsSalud que el empleador se ahorra
/// al no estar afecta la gratificación a aportes sociales (Ley 29351).
/// </summary>
public static class GratificacionCalculadora
{
    public static GratificacionResultado Calcular(GratificacionInput input, ParametrosGratificacion parametros)
    {
        if (input.RemuneracionBasica.Monto <= 0)
            throw new ArgumentException("La remuneración básica debe ser mayor a cero.");
        if (input.MesesCompletados < 0 || input.MesesCompletados > 6)
            throw new ArgumentException("Los meses deben estar entre 0 y 6.");
        if (input.DiasAdicionales < 0 || input.DiasAdicionales > 29)
            throw new ArgumentException("Los días adicionales deben estar entre 0 y 29.");

        var asignacionFamiliar = input.TieneHijos
            ? (parametros.Rmv * (parametros.AsignacionFamiliarPct / 100m)).Redondear(RedondeoConcepto.Gratificacion)
            : new Money(0);

        var rc = input.RemuneracionBasica + asignacionFamiliar;

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
            MesesCompletados:           input.MesesCompletados,
            DiasAdicionales:            input.DiasAdicionales,
            PctBonificacion:            pctBonif
        );
    }
}

public sealed record GratificacionInput(
    Money RemuneracionBasica,
    bool  TieneHijos,
    int   MesesCompletados,
    int   DiasAdicionales,
    bool  AportaAEps = false
);

public sealed record ParametrosGratificacion(
    Money   Rmv,
    decimal AsignacionFamiliarPct,
    decimal EssaludBonifPct,
    decimal EpsBonifPct,
    string  Version,
    DateOnly FechaActualizacion
);

public sealed record GratificacionResultado(
    Money   Gratificacion,
    Money   BonificacionExtraordinaria,
    Money   TotalDeposito,
    Money   RemuneracionComputable,
    Money   AsignacionFamiliar,
    int     MesesCompletados,
    int     DiasAdicionales,
    decimal PctBonificacion
);
