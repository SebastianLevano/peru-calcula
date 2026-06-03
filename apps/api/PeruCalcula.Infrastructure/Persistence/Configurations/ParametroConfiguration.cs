using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class ParametroConfiguration : IEntityTypeConfiguration<Parametro>
{
    public void Configure(EntityTypeBuilder<Parametro> b)
    {
        b.ToTable("parametros");
        b.HasKey(x => x.Id);
        b.Property(x => x.Clave).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
        b.Property(x => x.Tipo).HasMaxLength(20).IsRequired();
        b.Property(x => x.Valor).HasMaxLength(200).IsRequired();
        b.Property(x => x.Moneda).HasMaxLength(3);
        b.Property(x => x.Fuente).HasMaxLength(300).IsRequired();
        b.Property(x => x.Xmin).IsRowVersion();

        b.HasIndex(x => new { x.Clave, x.VigenciaDesde }).HasDatabaseName("ix_parametros_clave_vigencia");
    }
}
