using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class AnalyticsEventoConfiguration : IEntityTypeConfiguration<AnalyticsEvento>
{
    public void Configure(EntityTypeBuilder<AnalyticsEvento> b)
    {
        b.ToTable("analytics_eventos");
        b.HasKey(x => x.Id);
        b.Property(x => x.TipoEvento).HasMaxLength(50).IsRequired();
        b.Property(x => x.CalculadoraSlug).HasMaxLength(100).IsRequired();
        b.Property(x => x.Modulo).HasMaxLength(50).IsRequired();
        b.Property(x => x.Dispositivo).HasMaxLength(20).IsRequired();
        b.Property(x => x.ParametrosVersion).HasMaxLength(20);

        b.HasIndex(x => new { x.TipoEvento, x.CalculadoraSlug, x.FechaUtc })
            .HasDatabaseName("ix_analytics_eventos_tipo_calc_fecha");
    }
}
