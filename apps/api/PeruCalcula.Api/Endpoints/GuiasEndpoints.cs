using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PeruCalcula.Infrastructure.Persistence;
using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Api.Endpoints;

public static class GuiasEndpoints
{
    public static IEndpointRouteBuilder MapGuias(this IEndpointRouteBuilder app)
    {
        // Endpoints públicos
        var pub = app.MapGroup("/api/v1/guias").WithTags("Guías");
        pub.MapGet("/",         ListarGuias)  .WithName("ListarGuias");
        pub.MapGet("/{slug}",   ObtenerGuia)  .WithName("ObtenerGuia");
        pub.MapGet("/buscar",   BuscarGuias)  .WithName("BuscarGuias");

        // Admin CRUD
        var adm = app.MapGroup("/api/v1/admin/guias").WithTags("Admin").RequireAuthorization("admin");
        adm.MapGet   ("/",       ListarGuiasAdmin).WithName("ListarGuiasAdmin");
        adm.MapPost  ("/",       CrearGuia)       .WithName("CrearGuia");
        adm.MapPut   ("/{id}",   ActualizarGuia)  .WithName("ActualizarGuia");
        adm.MapDelete("/{id}",   EliminarGuia)    .WithName("EliminarGuia");
        adm.MapPost  ("/seed",   SeedGuiasIniciales).WithName("SeedGuiasIniciales");

        return app;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    private static async Task<IResult> SeedGuiasIniciales(AppDbContext db, CancellationToken ct)
    {
        var insertadas = 0;
        foreach (var guia in SeedGuias.Iniciales())
        {
            if (!await db.Guias.AnyAsync(g => g.Slug == guia.Slug, ct))
            {
                db.Guias.Add(guia);
                insertadas++;
            }
        }
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { insertadas, mensaje = $"{insertadas} guías insertadas." });
    }

    private static async Task<IResult> ListarGuiasAdmin(AppDbContext db, CancellationToken ct)
    {
        var guias = await db.Guias
            .Where(g => g.Estado != "archivado")
            .OrderByDescending(g => g.ActualizadoEn)
            .Select(g => new
            {
                g.Id, g.Slug, g.Titulo, g.Resumen,
                g.CalculadoraRelacionada, g.Estado,
                actualizadoEn = g.ActualizadoEn,
            })
            .ToListAsync(ct);

        return Results.Ok(guias);
    }

    // ── Públicos ──────────────────────────────────────────────────────────────

    private static async Task<IResult> ListarGuias(AppDbContext db, CancellationToken ct)
    {
        var guias = await db.Guias
            .Where(g => g.Estado == "publicado")
            .OrderByDescending(g => g.PublicadoEn)
            .Select(g => new
            {
                g.Slug, g.Titulo, g.Resumen, g.CalculadoraRelacionada,
                g.MetaDescription, actualizadoEn = g.ActualizadoEn,
            })
            .ToListAsync(ct);

        return Results.Ok(guias);
    }

    private static async Task<IResult> ObtenerGuia(string slug, AppDbContext db, CancellationToken ct)
    {
        var guia = await db.Guias
            .Where(g => g.Slug == slug && g.Estado == "publicado")
            .Select(g => new
            {
                g.Slug, g.Titulo, g.Resumen, g.CuerpoMarkdown,
                g.CalculadoraRelacionada, g.MetaTitle, g.MetaDescription,
                actualizadoEn = g.ActualizadoEn,
            })
            .FirstOrDefaultAsync(ct);

        return guia is null ? Results.NotFound() : Results.Ok(guia);
    }

    private static async Task<IResult> BuscarGuias(
        string q, AppDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Results.BadRequest(new { error = "La búsqueda debe tener al menos 2 caracteres." });

        // Full-Text Search con PostgreSQL (ADR-37)
        // EF Core + Npgsql: usar FromSql para FTS con ts_rank
        var resultados = await db.Guias
            .Where(g => g.Estado == "publicado"
                     && EF.Functions.ToTsVector("spanish", g.Titulo + " " + g.Resumen + " " + g.CuerpoMarkdown)
                        .Matches(EF.Functions.PlainToTsQuery("spanish", q)))
            .OrderByDescending(g => EF.Functions.ToTsVector("spanish", g.Titulo + " " + g.Resumen + " " + g.CuerpoMarkdown)
                                               .RankCoverDensity(EF.Functions.PlainToTsQuery("spanish", q)))
            .Take(20)
            .Select(g => new { g.Slug, g.Titulo, g.Resumen, g.CalculadoraRelacionada })
            .ToListAsync(ct);

        return Results.Ok(resultados);
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    private static async Task<IResult> CrearGuia(
        GuiaRequest req, AppDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Titulo) || string.IsNullOrWhiteSpace(req.CuerpoMarkdown))
            return Results.BadRequest(new { error = "Título y contenido son obligatorios." });

        var slug = req.Slug ?? GenerarSlug(req.Titulo);

        if (await db.Guias.AnyAsync(g => g.Slug == slug, ct))
            return Results.Conflict(new { error = $"Ya existe una guía con el slug '{slug}'." });

        var guia = new Guia
        {
            Slug                   = slug,
            Titulo                 = req.Titulo,
            Resumen                = req.Resumen,
            CuerpoMarkdown         = req.CuerpoMarkdown,  // almacenar Markdown sanitizado, nunca HTML crudo
            CalculadoraRelacionada = req.CalculadoraRelacionada,
            MetaTitle              = req.MetaTitle,
            MetaDescription        = req.MetaDescription,
            Estado                 = req.Estado ?? "borrador",
            PublicadoEn            = req.Estado == "publicado" ? DateTimeOffset.UtcNow : null,
            ActualizadoEn          = DateTimeOffset.UtcNow,
        };

        db.Guias.Add(guia);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/v1/guias/{guia.Slug}", new { guia.Id, guia.Slug });
    }

    private static async Task<IResult> ActualizarGuia(
        int id, GuiaRequest req, AppDbContext db, CancellationToken ct)
    {
        var guia = await db.Guias.FindAsync([id], ct);
        if (guia is null) return Results.NotFound();

        guia.Titulo                 = req.Titulo;
        guia.Resumen                = req.Resumen;
        guia.CuerpoMarkdown         = req.CuerpoMarkdown;
        guia.CalculadoraRelacionada = req.CalculadoraRelacionada;
        guia.MetaTitle              = req.MetaTitle;
        guia.MetaDescription        = req.MetaDescription;
        guia.ActualizadoEn          = DateTimeOffset.UtcNow;

        if (req.Estado is not null && guia.Estado != req.Estado)
        {
            guia.Estado = req.Estado;
            if (req.Estado == "publicado" && guia.PublicadoEn is null)
                guia.PublicadoEn = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Results.Ok(new { guia.Id, guia.Slug, guia.Estado });
    }

    private static async Task<IResult> EliminarGuia(int id, AppDbContext db, CancellationToken ct)
    {
        var guia = await db.Guias.FindAsync([id], ct);
        if (guia is null) return Results.NotFound();

        guia.Estado = "archivado";
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static string GenerarSlug(string titulo) =>
        titulo.ToLowerInvariant()
              .Replace(" ", "-")
              .Replace("á", "a").Replace("é", "e").Replace("í", "i")
              .Replace("ó", "o").Replace("ú", "u").Replace("ñ", "n")
              .Where(c => char.IsLetterOrDigit(c) || c == '-')
              .Aggregate(string.Empty, (s, c) => s + c)
              .Trim('-');
}

public sealed record GuiaRequest(
    string  Titulo,
    string  Resumen,
    string  CuerpoMarkdown,
    string? Slug                   = null,
    string? CalculadoraRelacionada = null,
    string? MetaTitle              = null,
    string? MetaDescription        = null,
    string? Estado                 = null
);
