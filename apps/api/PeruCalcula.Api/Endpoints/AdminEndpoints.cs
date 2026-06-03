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
        group.MapPut   ("/tasas/{id}",       UpdateTasa).RequireAuthorization("admin");

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
