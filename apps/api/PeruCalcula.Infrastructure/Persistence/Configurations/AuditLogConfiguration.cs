using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("audit_log");
        b.HasKey(x => x.Id);
        b.Property(x => x.Accion).HasMaxLength(100).IsRequired();
        b.Property(x => x.Entidad).HasMaxLength(100).IsRequired();
        b.Property(x => x.EntidadId).HasMaxLength(100).IsRequired();

        b.HasOne(x => x.AdminUser).WithMany(x => x.AuditLogs).HasForeignKey(x => x.AdminUserId);
        b.HasIndex(x => new { x.AdminUserId, x.Fecha }).HasDatabaseName("ix_audit_log_user_fecha");
    }
}
