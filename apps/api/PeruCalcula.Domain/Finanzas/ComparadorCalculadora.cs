using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Finanzas;

/// <summary>
/// Calcula cuota, TCEA y cronograma para un producto financiero dado.
/// TCEA (Tasa de Costo Efectivo Anual) = tasa anual r que resuelve:
///   P = sum_{k=1}^{n} (cuota_k + comision) / (1+r)^(k/12)
/// Resuelta por Newton-Raphson. Ref: Resolución SBS 6523-2013.
/// </summary>
public static class ComparadorCalculadora
{
    public static ComparadorResultado Calcular(ComparadorInput input)
    {
        if (input.Monto <= 0)      throw new ArgumentException("El monto debe ser mayor a cero.");
        if (input.PlazoMeses <= 0) throw new ArgumentException("El plazo debe ser mayor a cero.");
        if (input.Tea is < 0 or > 10) throw new ArgumentException("La TEA debe estar entre 0 y 1000%.");
        if (input.ComisionAdminMensual < 0) throw new ArgumentException("La comisión no puede ser negativa.");

        decimal P = input.Monto;
        int     n = input.PlazoMeses;
        decimal tem = (decimal)(Math.Pow((double)(1 + input.Tea), 1.0 / 12) - 1);

        decimal cuota;
        if (tem == 0)
            cuota = Math.Round(P / n, 2, MidpointRounding.AwayFromZero);
        else
        {
            double factor = Math.Pow((double)(1 + tem), n);
            cuota = Math.Round(P * tem * (decimal)factor / ((decimal)factor - 1), 2, MidpointRounding.AwayFromZero);
        }

        // Flujo total por periodo (cuota + comisión)
        decimal flujoMensual = cuota + input.ComisionAdminMensual;

        // Cronograma
        var cronograma = new List<CuotaCronograma>(n);
        decimal saldo = P;
        decimal totalIntereses = 0;

        for (int mes = 1; mes <= n; mes++)
        {
            var interesMes   = Math.Round(saldo * tem, 2, MidpointRounding.AwayFromZero);
            var amortizacion = Math.Round(cuota - interesMes, 2, MidpointRounding.AwayFromZero);

            if (mes == n) amortizacion = Math.Round(saldo, 2, MidpointRounding.AwayFromZero);

            saldo = Math.Round(saldo - amortizacion, 2, MidpointRounding.AwayFromZero);
            totalIntereses += interesMes;

            cronograma.Add(new CuotaCronograma(
                Numero:       mes,
                Cuota:        new Money(cuota),
                Interes:      new Money(interesMes),
                Amortizacion: new Money(amortizacion),
                Saldo:        new Money(Math.Max(saldo, 0))
            ));
        }

        // TCEA por Newton-Raphson: P = sum F_k / (1+tcea)^(k/12)
        decimal tcea = CalcularTcea(P, flujoMensual, n);

        return new ComparadorResultado(
            Cuota:               new Money(cuota),
            ComisionMensual:     new Money(input.ComisionAdminMensual),
            FlujoMensual:        new Money(flujoMensual),
            Tem:                 tem,
            Tea:                 input.Tea,
            Tcea:                tcea,
            TotalPagado:         new Money(Math.Round(flujoMensual * n, 2, MidpointRounding.AwayFromZero)),
            TotalIntereses:      new Money(Math.Round(totalIntereses, 2, MidpointRounding.AwayFromZero)),
            TotalComisiones:     new Money(Math.Round(input.ComisionAdminMensual * n, 2, MidpointRounding.AwayFromZero)),
            Cronograma:          cronograma
        );
    }

    // Newton-Raphson para encontrar tcea tal que sum F_k/(1+tcea)^(k/12) = P
    private static decimal CalcularTcea(decimal P, decimal flujoMensual, int n)
    {
        if (flujoMensual <= 0) return 0;

        double p  = (double)P;
        double f  = (double)flujoMensual;

        // Estimación inicial: tcea ≈ TEA base
        double r = f * 12 / p - 1;
        if (r <= 0) r = 0.01;

        for (int iter = 0; iter < 100; iter++)
        {
            double vpn   = 0;
            double dvpn  = 0;

            for (int k = 1; k <= n; k++)
            {
                double exp    = k / 12.0;
                double denom  = Math.Pow(1 + r, exp);
                vpn  += f / denom;
                dvpn -= exp * f / (denom * (1 + r));
            }

            double delta = (vpn - p) / dvpn;
            r -= delta;

            if (Math.Abs(delta) < 1e-10) break;
        }

        return Math.Round((decimal)r, 6, MidpointRounding.AwayFromZero);
    }
}

public sealed record ComparadorInput(
    decimal Monto,
    int     PlazoMeses,
    decimal Tea,                   // Tasa Efectiva Anual, ej: 0.25 = 25%
    decimal ComisionAdminMensual   // comisión fija mensual en soles, ej: 10.00
);

public sealed record ComparadorResultado(
    Money                          Cuota,
    Money                          ComisionMensual,
    Money                          FlujoMensual,
    decimal                        Tem,
    decimal                        Tea,
    decimal                        Tcea,
    Money                          TotalPagado,
    Money                          TotalIntereses,
    Money                          TotalComisiones,
    IReadOnlyList<CuotaCronograma> Cronograma
);
