using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> b)
    {
        b.ToTable("admin_users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Email).HasMaxLength(200).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        b.Property(x => x.Rol).HasMaxLength(50).IsRequired();

        b.HasIndex(x => x.Email).IsUnique().HasDatabaseName("ix_admin_users_email");
    }
}
