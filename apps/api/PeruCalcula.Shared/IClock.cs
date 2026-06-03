namespace PeruCalcula.Shared;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
    DateOnly Today { get; }
}
