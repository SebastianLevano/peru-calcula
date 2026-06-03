using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace PeruCalcula.Infrastructure.Persistence;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(
                Environment.GetEnvironmentVariable("PERU_CALCULA_DB")
                ?? "Host=localhost;Database=peru_calcula_dev;Username=postgres;Password=postgres")
            .Options;

        return new AppDbContext(options);
    }
}
