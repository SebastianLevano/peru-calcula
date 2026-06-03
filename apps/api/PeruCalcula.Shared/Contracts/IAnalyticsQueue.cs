namespace PeruCalcula.Shared.Contracts;

public interface IAnalyticsQueue
{
    void Encolar(AnalyticsEventoDto evento);
}
