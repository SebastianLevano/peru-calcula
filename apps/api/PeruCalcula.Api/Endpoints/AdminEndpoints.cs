using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PeruCalcula.Infrastructure.Persistence;
using PeruCalcula.Infrastructure.Persistence.Entities;
using PeruCalcula.Shared.Contracts;

namespace PeruCalcula.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdmin(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin").WithTags("Admin");

        // Auth (ADR-08: JWT corto + refresh revocable)
        group.MapPost("/auth/login",   Login)  .WithName("AdminLogin");
        group.MapPost("/auth/refresh", Refresh).WithName("AdminRefresh");
        group.MapPost("/auth/logout",  Logout) .WithName("AdminLogout").RequireAuthorization("admin");

        // Parámetros (requiere auth admin)
        group.MapGet   ("/parametros",       GetParametros).RequireAuthorization("admin");
        group.MapPut   ("/parametros/{id}",  UpdateParametro).RequireAuthorization("admin");

        // Tasas
        group.MapGet   ("/tasas",            GetTasas).RequireAuthorization("admin");
        group.MapPost  ("/tasas",            CreateTasa).RequireAuthorization("admin");
        group.MapPut   ("/tasas/{id}",       UpdateTasa).RequireAuthorization("admin");
        group.MapDelete("/tasas/{id}",       DeleteTasa).RequireAuthorization("admin");

        // Bancos CRUD (F3)
        group.MapGet   ("/bancos",           GetBancos).RequireAuthorization("admin");
        group.MapPost  ("/bancos",           CreateBanco).RequireAuthorization("admin");
        group.MapPut   ("/bancos/{id}",      UpdateBanco).RequireAuthorization("admin");
        group.MapDelete("/bancos/{id}",      DeleteBanco).RequireAuthorization("admin");

        // Productos financieros CRUD (F3)
        group.MapGet   ("/bancos/{bancoId}/productos",     GetProductos).RequireAuthorization("admin");
        group.MapPost  ("/bancos/{bancoId}/productos",     CreateProducto).RequireAuthorization("admin");
        group.MapPut   ("/productos/{id}",                 UpdateProducto).RequireAuthorization("admin");
        group.MapDelete("/productos/{id}",                 DeleteProducto).RequireAuthorization("admin");

        // Dashboard analytics (desde rollups)
        group.MapGet   ("/analytics/dashboard", GetDashboard).RequireAuthorization("admin");

        return app;
    }

    // ── Auth ─────────────────────────────────────────────────────────────────

    private static async Task<IResult> Login(
        LoginRequest req,
        AppDbContext db,
        IConfiguration config,
        CancellationToken ct)
    {
        var user = await db.AdminUsers
            .FirstOrDefaultAsync(u => u.Email == req.Email && u.Activo, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Results.Problem("Credenciales incorrectas.", statusCode: 401);

        var (accessToken, refreshToken) = GenerateTokens(user, config);

        var tokenHash = HashToken(refreshToken);
        db.AdminRefreshTokens.Add(new AdminRefreshToken
        {
            AdminUserId = user.Id,
            TokenHash   = tokenHash,
            ExpiraEn    = DateTimeOffset.UtcNow.AddDays(7),
            CreadoEn    = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { accessToken, refreshToken });
    }

    private static async Task<IResult> Refresh(
        RefreshRequest req,
        AppDbContext db,
        IConfiguration config,
        CancellationToken ct)
    {
        var tokenHash = HashToken(req.RefreshToken);

        var stored = await db.AdminRefreshTokens
            .Include(t => t.AdminUser)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);

        if (stored is null || stored.EstaRevocado || !stored.AdminUser.Activo)
            return Results.Problem("Refresh token inválido o expirado.", statusCode: 401);

        // Rotación: revocar el anterior
        stored.RevocadoEn = DateTimeOffset.UtcNow;

        var (accessToken, newRefreshToken) = GenerateTokens(stored.AdminUser, config);
        db.AdminRefreshTokens.Add(new AdminRefreshToken
        {
            AdminUserId = stored.AdminUserId,
            TokenHash   = HashToken(newRefreshToken),
            ExpiraEn    = DateTimeOffset.UtcNow.AddDays(7),
            CreadoEn    = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { accessToken, refreshToken = newRefreshToken });
    }

    private static async Task<IResult> Logout(
        RefreshRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        var tokenHash = HashToken(req.RefreshToken);
        var stored = await db.AdminRefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);

        if (stored is not null)
        {
            stored.RevocadoEn = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        return Results.NoContent();
    }

    // ── Parámetros ────────────────────────────────────────────────────────────

    private static async Task<IResult> GetParametros(AppDbContext db, CancellationToken ct)
    {
        var parametros = await db.Parametros
            .Where(p => p.VigenciaHasta == null || p.VigenciaHasta >= DateOnly.FromDateTime(DateTime.Today))
            .OrderBy(p => p.Clave)
            .Select(p => new { p.Id, p.Clave, p.Descripcion, p.Valor, p.Moneda, p.Fuente, p.VigenciaDesde, p.Xmin })
            .ToListAsync(ct);

        return Results.Ok(parametros);
    }

    private static async Task<IResult> UpdateParametro(
        int id,
        UpdateParametroRequest req,
        AppDbContext db,
        IParametroService parametroService,
        CancellationToken ct)
    {
        var param = await db.Parametros.FindAsync([id], ct);
        if (param is null) return Results.NotFound();

        // Optimistic concurrency: comparar xmin
        if (param.Xmin != req.Xmin)
            return Results.Conflict(new { error = "El parámetro fue modificado por otro usuario. Recarga y vuelve a intentarlo." });

        param.Valor       = req.Valor;
        param.Fuente      = req.Fuente;
        param.VigenciaDesde = req.VigenciaDesde;

        await db.SaveChangesAsync(ct);

        // Invalidar caché para que los cálculos usen el nuevo valor inmediatamente (ADR-24)
        parametroService.InvalidarCache();

        return Results.Ok(new { param.Id, param.Clave, param.Valor });
    }

    // ── Tasas ─────────────────────────────────────────────────────────────────

    private static async Task<IResult> GetTasas(AppDbContext db, CancellationToken ct)
    {
        var tasas = await db.TasasHistoricas
            .Include(t => t.Producto).ThenInclude(p => p.Banco)
            .Where(t => t.VigenciaHasta == null || t.VigenciaHasta >= DateOnly.FromDateTime(DateTime.Today))
            .OrderBy(t => t.Producto.Banco.Nombre)
            .Select(t => new
            {
                t.Id, t.Tea, t.Tcea, t.ComisionAdmin, t.VigenciaDesde, t.Fuente, t.EsReferencial, t.Xmin,
                banco    = t.Producto.Banco.Nombre,
                producto = t.Producto.Nombre,
            })
            .ToListAsync(ct);

        return Results.Ok(tasas);
    }

    private static async Task<IResult> UpdateTasa(
        int id,
        UpdateTasaRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        var tasa = await db.TasasHistoricas.FindAsync([id], ct);
        if (tasa is null) return Results.NotFound();

        if (tasa.Xmin != req.Xmin)
            return Results.Conflict(new { error = "La tasa fue modificada por otro usuario. Recarga y vuelve a intentarlo." });

        tasa.Tea           = req.Tea;
        tasa.Tcea          = req.Tcea;
        tasa.ComisionAdmin = req.ComisionAdmin;
        tasa.Fuente        = req.Fuente;
        tasa.VigenciaDesde = req.VigenciaDesde;

        await db.SaveChangesAsync(ct);
        return Results.Ok(new { tasa.Id, tasa.Tea, tasa.Tcea });
    }

    // ── Tasas CRUD ────────────────────────────────────────────────────────────

    private static async Task<IResult> CreateTasa(
        CreateTasaRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        var producto = await db.ProductosFinancieros.FindAsync([req.ProductoId], ct);
        if (producto is null) return Results.NotFound(new { error = "Producto no encontrado." });

        // Cerrar tasa vigente anterior
        var tasaAnterior = await db.TasasHistoricas
            .Where(t => t.ProductoId == req.ProductoId && t.VigenciaHasta == null)
            .FirstOrDefaultAsync(ct);

        if (tasaAnterior is not null)
            tasaAnterior.VigenciaHasta = req.VigenciaDesde.AddDays(-1);

        var nueva = new TasaHistorica
        {
            ProductoId    = req.ProductoId,
            Tea           = req.Tea,
            Tcea          = req.Tcea,
            ComisionAdmin = req.ComisionAdmin,
            VigenciaDesde = req.VigenciaDesde,
            VigenciaHasta = null,
            Fuente        = req.Fuente,
            EsReferencial = req.EsReferencial,
        };
        db.TasasHistoricas.Add(nueva);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/v1/admin/tasas/{nueva.Id}", new { nueva.Id });
    }

    private static async Task<IResult> DeleteTasa(int id, AppDbContext db, CancellationToken ct)
    {
        var tasa = await db.TasasHistoricas.FindAsync([id], ct);
        if (tasa is null) return Results.NotFound();

        // Soft-delete: cierra la vigencia con la fecha de hoy
        tasa.VigenciaHasta = DateOnly.FromDateTime(DateTime.UtcNow);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    // ── Bancos CRUD ────────────────────────────────────────────────────────────

    private static async Task<IResult> GetBancos(AppDbContext db, CancellationToken ct)
    {
        var bancos = await db.Bancos
            .Include(b => b.Productos)
            .OrderBy(b => b.Orden)
            .ToListAsync(ct);

        return Results.Ok(bancos.Select(b => new
        {
            b.Id, b.Nombre, b.Slug, b.LogoUrl, b.SitioUrl, b.UrlAfiliado,
            b.EsPatrocinado, b.Activo, b.Orden,
            productos = b.Productos.Count,
        }));
    }

    private static async Task<IResult> CreateBanco(
        CreateBancoRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        if (await db.Bancos.AnyAsync(b => b.Slug == req.Slug, ct))
            return Results.Conflict(new { error = "Ya existe un banco con ese slug." });

        var banco = new Banco
        {
            Nombre        = req.Nombre,
            Slug          = req.Slug,
            LogoUrl       = req.LogoUrl,
            SitioUrl      = req.SitioUrl,
            UrlAfiliado   = req.UrlAfiliado,
            EsPatrocinado = req.EsPatrocinado,
            Activo        = true,
            Orden         = req.Orden,
        };
        db.Bancos.Add(banco);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/v1/admin/bancos/{banco.Id}", new { banco.Id, banco.Nombre });
    }

    private static async Task<IResult> UpdateBanco(
        int id,
        UpdateBancoRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        var banco = await db.Bancos.FindAsync([id], ct);
        if (banco is null) return Results.NotFound();

        banco.Nombre        = req.Nombre;
        banco.LogoUrl       = req.LogoUrl;
        banco.SitioUrl      = req.SitioUrl;
        banco.UrlAfiliado   = req.UrlAfiliado;
        banco.EsPatrocinado = req.EsPatrocinado;
        banco.Activo        = req.Activo;
        banco.Orden         = req.Orden;

        await db.SaveChangesAsync(ct);
        return Results.Ok(new { banco.Id, banco.Nombre, banco.Activo });
    }

    private static async Task<IResult> DeleteBanco(int id, AppDbContext db, CancellationToken ct)
    {
        var banco = await db.Bancos.FindAsync([id], ct);
        if (banco is null) return Results.NotFound();

        banco.Activo = false;
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // ── Productos financieros CRUD ─────────────────────────────────────────────

    private static async Task<IResult> GetProductos(int bancoId, AppDbContext db, CancellationToken ct)
    {
        var productos = await db.ProductosFinancieros
            .Include(p => p.Tasas.Where(t => t.VigenciaHasta == null))
            .Where(p => p.BancoId == bancoId)
            .OrderBy(p => p.Nombre)
            .ToListAsync(ct);

        return Results.Ok(productos.Select(p => new
        {
            p.Id, p.Nombre, p.Tipo, p.Moneda, p.Activo,
            tasaVigente = p.Tasas.FirstOrDefault() is { } t
                ? new { t.Id, t.Tea, t.Tcea, t.ComisionAdmin, t.VigenciaDesde, t.Fuente, t.EsReferencial, t.Xmin }
                : null,
        }));
    }

    private static async Task<IResult> CreateProducto(
        int bancoId,
        CreateProductoRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        if (!await db.Bancos.AnyAsync(b => b.Id == bancoId && b.Activo, ct))
            return Results.NotFound(new { error = "Banco no encontrado o inactivo." });

        var producto = new ProductoFinanciero
        {
            BancoId = bancoId,
            Nombre  = req.Nombre,
            Tipo    = req.Tipo,
            Moneda  = req.Moneda,
            Activo  = true,
        };
        db.ProductosFinancieros.Add(producto);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/v1/admin/productos/{producto.Id}", new { producto.Id, producto.Nombre });
    }

    private static async Task<IResult> UpdateProducto(
        int id,
        UpdateProductoRequest req,
        AppDbContext db,
        CancellationToken ct)
    {
        var producto = await db.ProductosFinancieros.FindAsync([id], ct);
        if (producto is null) return Results.NotFound();

        producto.Nombre = req.Nombre;
        producto.Tipo   = req.Tipo;
        producto.Moneda = req.Moneda;
        producto.Activo = req.Activo;

        await db.SaveChangesAsync(ct);
        return Results.Ok(new { producto.Id, producto.Nombre, producto.Activo });
    }

    private static async Task<IResult> DeleteProducto(int id, AppDbContext db, CancellationToken ct)
    {
        var producto = await db.ProductosFinancieros.FindAsync([id], ct);
        if (producto is null) return Results.NotFound();

        producto.Activo = false;
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    private static async Task<IResult> GetDashboard(AppDbContext db, CancellationToken ct)
    {
        var desde = DateOnly.FromDateTime(DateTime.Today.AddDays(-30));

        var rollups = await db.AnalyticsRollupsDiarios
            .Where(r => r.Fecha >= desde)
            .OrderByDescending(r => r.Fecha)
            .ToListAsync(ct);

        var totalInicios     = rollups.Sum(r => r.Inicios);
        var totalCompletados = rollups.Sum(r => r.Completados);
        var tasaCompletado   = totalInicios > 0
            ? Math.Round((double)totalCompletados / totalInicios * 100, 1)
            : 0;

        var porCalculadora = rollups
            .GroupBy(r => r.CalculadoraSlug)
            .Select(g => new
            {
                calculadora  = g.Key,
                inicios      = g.Sum(r => r.Inicios),
                completados  = g.Sum(r => r.Completados),
            })
            .OrderByDescending(x => x.completados);

        return Results.Ok(new
        {
            periodo          = new { desde = desde.ToString("yyyy-MM-dd"), hasta = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd") },
            totales          = new { inicios = totalInicios, completados = totalCompletados, tasaCompletadoPct = tasaCompletado },
            porCalculadora,
            rollupsDiarios   = rollups.Select(r => new { r.Fecha, r.CalculadoraSlug, r.Inicios, r.Completados }),
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static (string accessToken, string refreshToken) GenerateTokens(AdminUser user, IConfiguration config)
    {
        var jwtKey = config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key no configurado.");
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role,               user.Rol),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:   config["Jwt:Issuer"] ?? "PeruCalcula",
            audience: config["Jwt:Audience"] ?? "PeruCalcula",
            claims:   claims,
            expires:  DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds);

        var accessToken  = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        return (accessToken, refreshToken);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

// DTOs
public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);
public sealed record UpdateParametroRequest(string Valor, string Fuente, DateOnly VigenciaDesde, uint Xmin);
public sealed record UpdateTasaRequest(decimal Tea, decimal Tcea, decimal? ComisionAdmin, string Fuente, DateOnly VigenciaDesde, uint Xmin);
public sealed record CreateTasaRequest(int ProductoId, decimal Tea, decimal Tcea, decimal? ComisionAdmin, string Fuente, DateOnly VigenciaDesde, bool EsReferencial);

// Bancos
public sealed record CreateBancoRequest(string Nombre, string Slug, string? LogoUrl, string? SitioUrl, string? UrlAfiliado, bool EsPatrocinado, int Orden);
public sealed record UpdateBancoRequest(string Nombre, string? LogoUrl, string? SitioUrl, string? UrlAfiliado, bool EsPatrocinado, bool Activo, int Orden);

// Productos
public sealed record CreateProductoRequest(string Nombre, string Tipo, string Moneda);
public sealed record UpdateProductoRequest(string Nombre, string Tipo, string Moneda, bool Activo);
