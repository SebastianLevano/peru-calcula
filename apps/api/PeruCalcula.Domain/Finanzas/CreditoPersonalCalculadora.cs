using PeruCalcula.Shared;

namespace PeruCalcula.Domain.Finanzas;

/// <summary>
/// Calcula crédito personal con sistema francés (cuota fija).
/// cuota = P * i * (1+i)^n / ((1+i)^n - 1)  donde i = TEM = (1+TEA)^(1/12) - 1
/// </summary>
public static class CreditoPersonalCalculadora
{
    public static CreditoPersonalResultado Calcular(CreditoPersonalInput input)
    {
        if (input.Monto.Monto <= 0)        throw new ArgumentException("El monto debe ser mayor a cero.");
        if (input.PlazoMeses <= 0)          throw new ArgumentException("El plazo debe ser mayor a cero.");
        if (input.Tea is < 0 or > 10)       throw new ArgumentException("La TEA debe estar entre 0 y 1000%.");

        decimal P = input.Monto.Monto;
        decimal n = input.PlazoMeses;

        // TEM mensual
        decimal tem = (decimal)(Math.Pow((double)(1 + input.Tea), 1.0 / 12) - 1);

        decimal cuota;
        if (tem == 0)
        {
            cuota = Math.Round(P / n, 2, MidpointRounding.AwayFromZero);
        }
        else
        {
            double factor = Math.Pow((double)(1 + tem), (double)n);
            cuota = Math.Round(P * tem * (decimal)factor / ((decimal)factor - 1), 2, MidpointRounding.AwayFromZero);
        }

        var cuotaMoney = new Money(cuota, input.Monto.Moneda);

        // Cronograma de amortización
        var cronograma = new List<CuotaCronograma>((int)n);
        decimal saldo = P;
        decimal totalIntereses = 0;

        for (int mes = 1; mes <= (int)n; mes++)
        {
            var interesMes = Math.Round(saldo * tem, 2, MidpointRounding.AwayFromZero);
            var amortizacion = Math.Round(cuota - interesMes, 2, MidpointRounding.AwayFromZero);

            // Ajuste final para eliminar diferencias de redondeo
            if (mes == (int)n)
                amortizacion = Math.Round(saldo, 2, MidpointRounding.AwayFromZero);

            saldo = Math.Round(saldo - amortizacion, 2, MidpointRounding.AwayFromZero);
            totalIntereses += interesMes;

            cronograma.Add(new CuotaCronograma(
                Numero:       mes,
                Cuota:        new Money(cuota, input.Monto.Moneda),
                Interes:      new Money(interesMes, input.Monto.Moneda),
                Amortizacion: new Money(amortizacion, input.Monto.Moneda),
                Saldo:        new Money(Math.Max(saldo, 0), input.Monto.Moneda)
            ));
        }

        var totalPagado  = new Money(Math.Round(cuota * n, 2, MidpointRounding.AwayFromZero), input.Monto.Moneda);
        var totalInteres = new Money(Math.Round(totalIntereses, 2, MidpointRounding.AwayFromZero), input.Monto.Moneda);

        return new CreditoPersonalResultado(
            Cuota:          cuotaMoney,
            Tem:            tem,
            TotalPagado:    totalPagado,
            TotalIntereses: totalInteres,
            Cronograma:     cronograma
        );
    }
}

public sealed record CreditoPersonalInput(
    Money   Monto,
    int     PlazoMeses,
    decimal Tea          // Tasa Efectiva Anual, ej: 0.25 = 25%
);

public sealed record CuotaCronograma(
    int   Numero,
    Money Cuota,
    Money Interes,
    Money Amortizacion,
    Money Saldo
);

public sealed record CreditoPersonalResultado(
    Money                    Cuota,
    decimal                  Tem,
    Money                    TotalPagado,
    Money                    TotalIntereses,
    IReadOnlyList<CuotaCronograma> Cronograma
);
