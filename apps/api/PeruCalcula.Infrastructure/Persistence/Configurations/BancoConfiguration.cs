using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class BancoConfiguration : IEntityTypeConfiguration<Banco>
{
    public void Configure(EntityTypeBuilder<Banco> b)
    {
        b.ToTable("bancos");
        b.HasKey(x => x.Id);
        b.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
        b.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        b.Property(x => x.LogoUrl).HasMaxLength(500);
        b.Property(x => x.SitioUrl).HasMaxLength(500);
        b.Property(x => x.UrlAfiliado).HasMaxLength(500);

        b.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("ix_bancos_slug");
    }
}
