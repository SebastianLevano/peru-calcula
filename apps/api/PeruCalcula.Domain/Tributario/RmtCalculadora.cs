using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Tributario;

/// <summary>
/// Calcula el impuesto anual y el pago a cuenta mensual del Régimen MYPE Tributario (D.Leg. 1269).
/// Renta anual:
///   Hasta 15 UIT      → 10%
///   Exceso de 15 UIT  → 29.5%
/// Pago a cuenta mensual:
///   Si renta neta acumulada ≤ 300 UIT → 1% de ingresos netos del mes
///   Si supera 300 UIT → coeficiente (se usa 1.5% como referencia conservadora)
/// </summary>
public static class RmtCalculadora
{
    public static RmtResultado Calcular(RmtInput input, ParametrosRmt parametros)
    {
        if (input.IngresosNetos.Monto < 0)
            throw new ArgumentException("Los ingresos netos no pueden ser negativos.");

        var uit           = parametros.Uit.Monto;
        var tramo1Limite  = parametros.Tramo1UITs * uit;    // 15 UIT
        var limiteCuenta  = parametros.PagosCuentaUITs * uit; // 300 UIT

        // Renta anual estimada (proyección 12 meses)
        var rentaAnual = input.IngresosNetos.Monto * 12m;

        // Impuesto anual (tramos)
        decimal impuestoAnual;
        decimal impuestoTramo1;
        decimal impuestoTramo2;

        if (rentaAnual <= tramo1Limite)
        {
            impuestoTramo1 = Math.Round(rentaAnual * (parametros.Tramo1Pct / 100m), 2, MidpointRounding.AwayFromZero);
            impuestoTramo2 = 0m;
        }
        else
        {
            impuestoTramo1 = Math.Round(tramo1Limite * (parametros.Tramo1Pct / 100m), 2, MidpointRounding.AwayFromZero);
            impuestoTramo2 = Math.Round((rentaAnual - tramo1Limite) * (parametros.Tramo2Pct / 100m), 2, MidpointRounding.AwayFromZero);
        }
        impuestoAnual = impuestoTramo1 + impuestoTramo2;

        // Pago a cuenta mensual
        var pctCuenta = rentaAnual <= limiteCuenta ? parametros.PagosCuentaPct : 1.5m;
        var pagoACuenta = (input.IngresosNetos * (pctCuenta / 100m)).Redondear(RedondeoConcepto.General);

        return new RmtResultado(
            PagoACuenta:      pagoACuenta,
            ImpuestoAnual:    new Money(impuestoAnual),
            ImpuestoTramo1:   new Money(impuestoTramo1),
            ImpuestoTramo2:   new Money(impuestoTramo2),
            RentaAnualEstim:  new Money(rentaAnual),
            Tramo1Limite:     new Money(tramo1Limite),
            PctPagoACuenta:   pctCuenta,
            IngresosNetos:    input.IngresosNetos
        );
    }
}

public sealed record RmtInput(Money IngresosNetos);

public sealed record ParametrosRmt(
    Money    Uit,
    decimal  Tramo1UITs,
    decimal  Tramo1Pct,
    decimal  Tramo2Pct,
    decimal  PagosCuentaUITs,
    decimal  PagosCuentaPct,
    string   Version,
    DateOnly FechaActualizacion
);

public sealed record RmtResultado(
    Money   PagoACuenta,
    Money   ImpuestoAnual,
    Money   ImpuestoTramo1,
    Money   ImpuestoTramo2,
    Money   RentaAnualEstim,
    Money   Tramo1Limite,
    decimal PctPagoACuenta,
    Money   IngresosNetos
);
