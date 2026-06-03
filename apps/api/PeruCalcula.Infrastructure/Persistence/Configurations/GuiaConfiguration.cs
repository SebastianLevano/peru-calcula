using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NpgsqlTypes;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class GuiaConfiguration : IEntityTypeConfiguration<Guia>
{
    public void Configure(EntityTypeBuilder<Guia> b)
    {
        b.ToTable("guias");
        b.HasKey(x => x.Id);
        b.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        b.Property(x => x.Titulo).HasMaxLength(300).IsRequired();
        b.Property(x => x.Resumen).HasMaxLength(500).IsRequired();
        b.Property(x => x.CuerpoMarkdown).IsRequired();
        b.Property(x => x.CalculadoraRelacionada).HasMaxLength(100);
        b.Property(x => x.MetaTitle).HasMaxLength(70);
        b.Property(x => x.MetaDescription).HasMaxLength(160);
        b.Property(x => x.Estado).HasMaxLength(20).IsRequired();
        b.Property(x => x.SearchVector).HasColumnType("tsvector");

        b.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("ix_guias_slug");
        b.HasIndex(x => x.SearchVector)
            .HasMethod("GIN")
            .HasDatabaseName("ix_guias_search_vector");
    }
}
