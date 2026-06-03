using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class AdminRefreshTokenConfiguration : IEntityTypeConfiguration<AdminRefreshToken>
{
    public void Configure(EntityTypeBuilder<AdminRefreshToken> b)
    {
        b.ToTable("admin_refresh_tokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(500).IsRequired();
        b.Property(x => x.UserAgent).HasMaxLength(300);
        b.Property(x => x.IpHash).HasMaxLength(100);
        b.Ignore(x => x.EstaRevocado);

        b.HasOne(x => x.AdminUser).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.AdminUserId);
        b.HasIndex(x => new { x.AdminUserId, x.TokenHash }).HasDatabaseName("ix_admin_refresh_tokens_user_hash");
    }
}
