namespace PeruCalcula.Shared.Contracts;

public interface IFeatureFlags
{
    bool IsEnabled(string feature);
}
