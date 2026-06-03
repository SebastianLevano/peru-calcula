using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class AnalyticsRollupDiarioConfiguration : IEntityTypeConfiguration<AnalyticsRollupDiario>
{
    public void Configure(EntityTypeBuilder<AnalyticsRollupDiario> b)
    {
        b.ToTable("analytics_rollups_diarios");
        b.HasKey(x => x.Id);
        b.Property(x => x.CalculadoraSlug).HasMaxLength(100).IsRequired();
        b.Property(x => x.Modulo).HasMaxLength(50).IsRequired();

        b.HasIndex(x => new { x.Fecha, x.CalculadoraSlug })
            .IsUnique()
            .HasDatabaseName("ix_analytics_rollups_fecha_calc");
    }
}
