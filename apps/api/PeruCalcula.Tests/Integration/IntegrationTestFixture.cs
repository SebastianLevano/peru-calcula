using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PeruCalcula.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace PeruCalcula.Tests.Integration;

/// <summary>
/// Fixture compartida para tests de integración: levanta PostgreSQL real via Testcontainers,
/// aplica migraciones y expone un HttpClient contra la app real (ADR-28).
/// </summary>
public sealed class IntegrationTestFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("peru_calcula_test")
        .WithUsername("postgres")
        .WithPassword("postgres_test")
        .WithImage("postgres:17-alpine")
        .Build();

    public WebApplicationFactory<Program> Factory { get; private set; } = default!;
    public HttpClient Client { get; private set; } = default!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Reemplazar la cadena de conexión con la del contenedor
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);

                    services.AddDbContext<AppDbContext>(opt =>
                        opt.UseNpgsql(_postgres.GetConnectionString()));
                });

                builder.UseSetting("Jwt:Key", "test_key_minimo_32_chars_segura!!_ok");
                builder.UseSetting("Jwt:Issuer", "PeruCalcula");
                builder.UseSetting("Jwt:Audience", "PeruCalcula");
            });

        // Aplicar migraciones al container de test
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        // Seed mínimo: parámetros normativos necesarios para los endpoints
        if (!await db.Parametros.AnyAsync())
        {
            db.Parametros.AddRange(SeedParametros.Vigentes2026());
            await db.SaveChangesAsync();
        }

        Client = Factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }
}
