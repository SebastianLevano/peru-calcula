using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Laboral;

public static class CtsCalculadora
{
    /// <summary>
    /// Calcula la CTS semestral (mayo o noviembre) según D.Leg. 650.
    /// Formula: CTS = (RC/12)*meses_completos + (RC/360)*días_adicionales
    /// RC = básico + asig.familiar + 1/6 de gratificación ordinaria + promedios (si corresponde)
    /// </summary>
    public static CtsResultado Calcular(CtsInput input, ParametrosCts parametros)
    {
        ValidarInput(input);

        // 1. Remuneración computable
        var asignacionFamiliar = input.TieneHijos
            ? (parametros.Rmv * (parametros.AsignacionFamiliarPct / 100m)).Redondear(RedondeoConcepto.CTS)
            : new Money(0);

        var sextaGratificacion = (input.RemuneracionBasica * (1m / 6m)).Redondear(RedondeoConcepto.CTS);
        var rc = input.RemuneracionBasica + asignacionFamiliar + sextaGratificacion;

        // 2. Período computable (semestre: mayo=ene-abr o nov=jul-oct → max 4 meses)
        int meses  = Math.Min(input.MesesCompletados, 6);
        int dias   = Math.Min(input.DiasAdicionales, 29);

        // 3. Monto CTS
        var ctsMeses = (rc / 12m * meses).Redondear(RedondeoConcepto.CTS);
        var ctsDias  = (rc / 360m * dias).Redondear(RedondeoConcepto.CTS);
        var totalCts = (ctsMeses + ctsDias).Redondear(RedondeoConcepto.CTS);

        return new CtsResultado(
            MontoFinal:          totalCts,
            RemuneracionComputable: rc,
            AsignacionFamiliar:  asignacionFamiliar,
            SextaGratificacion:  sextaGratificacion,
            MesesCompletados:    meses,
            DiasAdicionales:     dias,
            CtsMeses:            ctsMeses,
            CtsDias:             ctsDias
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
    }
}

public sealed record CtsInput(
    Money RemuneracionBasica,
    bool  TieneHijos,
    int   MesesCompletados,
    int   DiasAdicionales
);

public sealed record ParametrosCts(
    Money   Rmv,
    decimal AsignacionFamiliarPct,
    string  Version,
    DateOnly FechaActualizacion
);

public sealed record CtsResultado(
    Money MontoFinal,
    Money RemuneracionComputable,
    Money AsignacionFamiliar,
    Money SextaGratificacion,
    int   MesesCompletados,
    int   DiasAdicionales,
    Money CtsMeses,
    Money CtsDias
);
