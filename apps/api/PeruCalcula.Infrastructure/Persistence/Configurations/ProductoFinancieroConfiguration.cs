using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class ProductoFinancieroConfiguration : IEntityTypeConfiguration<ProductoFinanciero>
{
    public void Configure(EntityTypeBuilder<ProductoFinanciero> b)
    {
        b.ToTable("productos_financieros");
        b.HasKey(x => x.Id);
        b.Property(x => x.Tipo).HasMaxLength(50).IsRequired();
        b.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
        b.Property(x => x.Moneda).HasMaxLength(3).IsRequired();

        b.HasOne(x => x.Banco).WithMany(x => x.Productos).HasForeignKey(x => x.BancoId);
    }
}
