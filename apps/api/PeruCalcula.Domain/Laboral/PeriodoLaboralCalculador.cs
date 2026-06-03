namespace PeruCalcula.Domain.Laboral;

/// <summary>
/// Calcula el período computable de CTS o Gratificación dado una fecha de ingreso.
///
/// CTS (D.Leg. 650, Art. 21):
///   - Depósito mayo  → período 1 nov (año anterior) – 30 abr (año actual)
///   - Depósito noviembre → período 1 may – 31 oct (año actual)
///
/// Gratificación (Ley 27735):
///   - Depósito julio     → período 1 ene – 30 jun
///   - Depósito diciembre → período 1 jul – 31 dic
///
/// Si el trabajador ingresó después del inicio del período, el cómputo
/// comienza desde su fecha de ingreso.
/// </summary>
public static class PeriodoLaboralCalculador
{
    public static PeriodoResultado CalcularCts(DateOnly fechaIngreso, DateOnly hoy)
    {
        // Determinar período activo según mes actual
        DateOnly inicioNormativo, finNormativo, nombrePeriodo;
        string nombre;

        if (hoy.Month is >= 11 or <= 4)
        {
            // Período noviembre→abril (depósito mayo)
            int añoInicio = hoy.Month >= 11 ? hoy.Year : hoy.Year - 1;
            inicioNormativo = new DateOnly(añoInicio, 11, 1);
            finNormativo    = new DateOnly(añoInicio + 1, 4, 30);
            nombre = $"Nov {añoInicio} – Abr {añoInicio + 1} (depósito mayo)";
        }
        else
        {
            // Período mayo→octubre (depósito noviembre)
            inicioNormativo = new DateOnly(hoy.Year, 5, 1);
            finNormativo    = new DateOnly(hoy.Year, 10, 31);
            nombre = $"May {hoy.Year} – Oct {hoy.Year} (depósito noviembre)";
        }

        return Calcular(fechaIngreso, inicioNormativo, finNormativo, hoy, nombre);
    }

    public static PeriodoResultado CalcularGratificacion(DateOnly fechaIngreso, DateOnly hoy)
    {
        DateOnly inicioNormativo, finNormativo;
        string nombre;

        if (hoy.Month <= 6)
        {
            // Período enero→junio (depósito julio)
            inicioNormativo = new DateOnly(hoy.Year, 1, 1);
            finNormativo    = new DateOnly(hoy.Year, 6, 30);
            nombre = $"Ene – Jun {hoy.Year} (depósito julio)";
        }
        else
        {
            // Período julio→diciembre (depósito diciembre)
            inicioNormativo = new DateOnly(hoy.Year, 7, 1);
            finNormativo    = new DateOnly(hoy.Year, 12, 31);
            nombre = $"Jul – Dic {hoy.Year} (depósito diciembre)";
        }

        return Calcular(fechaIngreso, inicioNormativo, finNormativo, hoy, nombre);
    }

    // ── Cálculo interno ───────────────────────────────────────────────────────

    private static PeriodoResultado Calcular(
        DateOnly fechaIngreso,
        DateOnly inicioNormativo,
        DateOnly finNormativo,
        DateOnly hoy,
        string nombre)
    {
        // El período efectivo comienza en la fecha de ingreso si es posterior al inicio normativo
        var inicioEfectivo = fechaIngreso > inicioNormativo ? fechaIngreso : inicioNormativo;

        // El período efectivo termina en hoy si el período normativo aún no cerró
        var finEfectivo = hoy < finNormativo ? hoy : finNormativo;

        if (inicioEfectivo > finEfectivo)
            return new PeriodoResultado(0, 0, inicioEfectivo, finEfectivo, inicioNormativo, finNormativo, nombre);

        // Contar meses completos y días restantes
        int meses = 0;
        var cursor = inicioEfectivo;

        while (true)
        {
            var siguienteMes = cursor.AddMonths(1);
            if (siguienteMes > finEfectivo.AddDays(1)) break;
            meses++;
            cursor = siguienteMes;
        }

        // Días sueltos = días desde el último mes completo hasta el fin efectivo
        // Math.Max(0,...) porque cuando el cursor llega exactamente al día siguiente del fin normativo
        // el resultado puede ser -1 (semestre completo, sin días sueltos).
        int dias = Math.Max(0,
            (finEfectivo.ToDateTime(TimeOnly.MinValue) - cursor.ToDateTime(TimeOnly.MinValue)).Days);

        return new PeriodoResultado(meses, dias, inicioEfectivo, finEfectivo, inicioNormativo, finNormativo, nombre);
    }
}

public sealed record PeriodoResultado(
    int      MesesCompletados,
    int      DiasAdicionales,
    DateOnly InicioEfectivo,
    DateOnly FinEfectivo,
    DateOnly InicioNormativo,
    DateOnly FinNormativo,
    string   Nombre
);
