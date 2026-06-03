using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class TasaHistoricaConfiguration : IEntityTypeConfiguration<TasaHistorica>
{
    public void Configure(EntityTypeBuilder<TasaHistorica> b)
    {
        b.ToTable("tasas_historicas");
        b.HasKey(x => x.Id);
        b.Property(x => x.Tea).HasColumnType("numeric(10,6)").IsRequired();
        b.Property(x => x.Tcea).HasColumnType("numeric(10,6)").IsRequired();
        b.Property(x => x.ComisionAdmin).HasColumnType("numeric(10,6)");
        b.Property(x => x.Fuente).HasMaxLength(300).IsRequired();
        b.Property(x => x.Xmin).IsRowVersion();

        b.HasOne(x => x.Producto).WithMany(x => x.Tasas).HasForeignKey(x => x.ProductoId);
        b.HasIndex(x => new { x.ProductoId, x.VigenciaDesde }).HasDatabaseName("ix_tasas_historicas_producto_vigencia");
    }
}
