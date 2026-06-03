using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using NpgsqlTypes;

#nullable disable

namespace PeruCalcula.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "admin_users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Rol = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    CreadoEn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "analytics_eventos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TipoEvento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CalculadoraSlug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Modulo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Dispositivo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ParametrosVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_analytics_eventos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "analytics_rollups_diarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    CalculadoraSlug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Modulo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Inicios = table.Column<long>(type: "bigint", nullable: false),
                    Completados = table.Column<long>(type: "bigint", nullable: false),
                    ExportPdf = table.Column<long>(type: "bigint", nullable: false),
                    ClicksAfiliado = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_analytics_rollups_diarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "bancos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SitioUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UrlAfiliado = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EsPatrocinado = table.Column<bool>(type: "boolean", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bancos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "guias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Titulo = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Resumen = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CuerpoMarkdown = table.Column<string>(type: "text", nullable: false),
                    CalculadoraRelacionada = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MetaTitle = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    MetaDescription = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PublicadoEn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ActualizadoEn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SearchVector = table.Column<NpgsqlTsVector>(type: "tsvector", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_guias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "parametros",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Clave = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Valor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Moneda = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    Fuente = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    VigenciaDesde = table.Column<DateOnly>(type: "date", nullable: false),
                    VigenciaHasta = table.Column<DateOnly>(type: "date", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parametros", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "admin_refresh_tokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AdminUserId = table.Column<int>(type: "integer", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiraEn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevocadoEn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreadoEn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UserAgent = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    IpHash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_refresh_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_admin_refresh_tokens_admin_users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "admin_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_log",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AdminUserId = table.Column<int>(type: "integer", nullable: false),
                    Accion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Entidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntidadId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DatosJson = table.Column<string>(type: "text", nullable: true),
                    Fecha = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_log", x => x.Id);
                    table.ForeignKey(
                        name: "FK_audit_log_admin_users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "admin_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "productos_financieros",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BancoId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Moneda = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_productos_financieros", x => x.Id);
                    table.ForeignKey(
                        name: "FK_productos_financieros_bancos_BancoId",
                        column: x => x.BancoId,
                        principalTable: "bancos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tasas_historicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductoId = table.Column<int>(type: "integer", nullable: false),
                    Tea = table.Column<decimal>(type: "numeric(10,6)", nullable: false),
                    Tcea = table.Column<decimal>(type: "numeric(10,6)", nullable: false),
                    ComisionAdmin = table.Column<decimal>(type: "numeric(10,6)", nullable: true),
                    VigenciaDesde = table.Column<DateOnly>(type: "date", nullable: false),
                    VigenciaHasta = table.Column<DateOnly>(type: "date", nullable: true),
                    Fuente = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    EsReferencial = table.Column<bool>(type: "boolean", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tasas_historicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tasas_historicas_productos_financieros_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "productos_financieros",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_admin_refresh_tokens_user_hash",
                table: "admin_refresh_tokens",
                columns: new[] { "AdminUserId", "TokenHash" });

            migrationBuilder.CreateIndex(
                name: "ix_admin_users_email",
                table: "admin_users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_analytics_eventos_tipo_calc_fecha",
                table: "analytics_eventos",
                columns: new[] { "TipoEvento", "CalculadoraSlug", "FechaUtc" });

            migrationBuilder.CreateIndex(
                name: "ix_analytics_rollups_fecha_calc",
                table: "analytics_rollups_diarios",
                columns: new[] { "Fecha", "CalculadoraSlug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_audit_log_user_fecha",
                table: "audit_log",
                columns: new[] { "AdminUserId", "Fecha" });

            migrationBuilder.CreateIndex(
                name: "ix_bancos_slug",
                table: "bancos",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_guias_search_vector",
                table: "guias",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "ix_guias_slug",
                table: "guias",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_parametros_clave_vigencia",
                table: "parametros",
                columns: new[] { "Clave", "VigenciaDesde" });

            migrationBuilder.CreateIndex(
                name: "IX_productos_financieros_BancoId",
                table: "productos_financieros",
                column: "BancoId");

            migrationBuilder.CreateIndex(
                name: "ix_tasas_historicas_producto_vigencia",
                table: "tasas_historicas",
                columns: new[] { "ProductoId", "VigenciaDesde" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_refresh_tokens");

            migrationBuilder.DropTable(
                name: "analytics_eventos");

            migrationBuilder.DropTable(
                name: "analytics_rollups_diarios");

            migrationBuilder.DropTable(
                name: "audit_log");

            migrationBuilder.DropTable(
                name: "guias");

            migrationBuilder.DropTable(
                name: "parametros");

            migrationBuilder.DropTable(
                name: "tasas_historicas");

            migrationBuilder.DropTable(
                name: "admin_users");

            migrationBuilder.DropTable(
                name: "productos_financieros");

            migrationBuilder.DropTable(
                name: "bancos");
        }
    }
}
