using Microsoft.Extensions.Configuration;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Infrastructure;

public sealed class ConfigFeatureFlags(IConfiguration config) : IFeatureFlags
{
    public bool IsEnabled(string feature) =>
        bool.TryParse(config[$"FeatureFlags:{feature}"], out var v) && v;
}
