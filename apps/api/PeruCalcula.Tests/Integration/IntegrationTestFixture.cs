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

        // Seed bancos/productos/tasas para tests del comparador (F3)
        if (!await db.Bancos.AnyAsync())
        {
            var bcp = new PeruCalcula.Infrastructure.Persistence.Entities.Banco
            {
                Nombre = "BCP", Slug = "bcp", LogoUrl = null, SitioUrl = "https://bcp.com.pe",
                UrlAfiliado = null, EsPatrocinado = false, Activo = true, Orden = 1,
            };
            var interbank = new PeruCalcula.Infrastructure.Persistence.Entities.Banco
            {
                Nombre = "Interbank", Slug = "interbank", SitioUrl = "https://interbank.pe",
                EsPatrocinado = false, Activo = true, Orden = 2,
            };
            db.Bancos.AddRange(bcp, interbank);
            await db.SaveChangesAsync();

            var prodBcp = new PeruCalcula.Infrastructure.Persistence.Entities.ProductoFinanciero
            {
                BancoId = bcp.Id, Nombre = "Crédito Efectivo BCP", Tipo = "personal", Moneda = "PEN", Activo = true,
            };
            var prodInterbank = new PeruCalcula.Infrastructure.Persistence.Entities.ProductoFinanciero
            {
                BancoId = interbank.Id, Nombre = "Préstamo Personal Interbank", Tipo = "personal", Moneda = "PEN", Activo = true,
            };
            db.ProductosFinancieros.AddRange(prodBcp, prodInterbank);
            await db.SaveChangesAsync();

            db.TasasHistoricas.AddRange(
                new PeruCalcula.Infrastructure.Persistence.Entities.TasaHistorica
                {
                    ProductoId = prodBcp.Id, Tea = 0.40m, Tcea = 0.42m, ComisionAdmin = 10m,
                    VigenciaDesde = new DateOnly(2026, 1, 1), Fuente = "SBS / Test", EsReferencial = true,
                },
                new PeruCalcula.Infrastructure.Persistence.Entities.TasaHistorica
                {
                    ProductoId = prodInterbank.Id, Tea = 0.35m, Tcea = 0.37m, ComisionAdmin = 8m,
                    VigenciaDesde = new DateOnly(2026, 1, 1), Fuente = "SBS / Test", EsReferencial = true,
                }
            );
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
