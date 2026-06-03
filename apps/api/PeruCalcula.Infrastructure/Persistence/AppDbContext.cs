using Microsoft.EntityFrameworkCore;
using PeruCalcula.Infrastructure.Persistence.Configurations;

namespace PeruCalcula.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Entities.Parametro>              Parametros              => Set<Entities.Parametro>();
    public DbSet<Entities.Banco>                  Bancos                  => Set<Entities.Banco>();
    public DbSet<Entities.ProductoFinanciero>      ProductosFinancieros    => Set<Entities.ProductoFinanciero>();
    public DbSet<Entities.TasaHistorica>           TasasHistoricas         => Set<Entities.TasaHistorica>();
    public DbSet<Entities.Guia>                    Guias                   => Set<Entities.Guia>();
    public DbSet<Entities.AnalyticsEvento>         AnalyticsEventos        => Set<Entities.AnalyticsEvento>();
    public DbSet<Entities.AnalyticsRollupDiario>   AnalyticsRollupsDiarios => Set<Entities.AnalyticsRollupDiario>();
    public DbSet<Entities.AdminUser>               AdminUsers              => Set<Entities.AdminUser>();
    public DbSet<Entities.AdminRefreshToken>       AdminRefreshTokens      => Set<Entities.AdminRefreshToken>();
    public DbSet<Entities.AuditLog>                AuditLogs               => Set<Entities.AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
