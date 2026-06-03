namespace PeruCalcula.Shared;

public enum MonedaIso { PEN, USD }

public enum RedondeoConcepto
{
    CTS,
    Gratificacion,
    Vacaciones,
    Retencion4ta,
    CuotaCredito,
    General,
}

public readonly record struct Money(decimal Monto, MonedaIso Moneda = MonedaIso.PEN)
{
    private static readonly Dictionary<RedondeoConcepto, int> _decimalesPorConcepto = new()
    {
        [RedondeoConcepto.CTS]           = 2,
        [RedondeoConcepto.Gratificacion] = 2,
        [RedondeoConcepto.Vacaciones]    = 2,
        [RedondeoConcepto.Retencion4ta]  = 2,
        [RedondeoConcepto.CuotaCredito]  = 2,
        [RedondeoConcepto.General]       = 2,
    };

    public Money Redondear(RedondeoConcepto concepto)
    {
        int decimales = _decimalesPorConcepto[concepto];
        return this with { Monto = Math.Round(Monto, decimales, MidpointRounding.AwayFromZero) };
    }

    public static Money operator +(Money a, Money b)
    {
        EnsureSameCurrency(a, b);
        return new Money(a.Monto + b.Monto, a.Moneda);
    }

    public static Money operator -(Money a, Money b)
    {
        EnsureSameCurrency(a, b);
        return new Money(a.Monto - b.Monto, a.Moneda);
    }

    public static Money operator *(Money a, decimal factor) => new(a.Monto * factor, a.Moneda);
    public static Money operator *(decimal factor, Money a) => a * factor;
    public static Money operator /(Money a, decimal divisor) => new(a.Monto / divisor, a.Moneda);

    private static void EnsureSameCurrency(Money a, Money b)
    {
        if (a.Moneda != b.Moneda)
            throw new InvalidOperationException($"No se pueden operar monedas distintas: {a.Moneda} y {b.Moneda}");
    }

    public override string ToString() => $"{Moneda} {Monto:F2}";
}
