using System.Text;
using Microsoft.EntityFrameworkCore;
using PeruCalcula.Infrastructure.Persistence;

namespace PeruCalcula.Api.Endpoints;

public static class SeoEndpoints
{
    private static readonly string[] RutasEstaticas =
    [
        "/",
        "/calculadora-cts",
        "/calculadora-gratificacion",
        "/calculadora-vacaciones",
        "/calculadora-rus",
        "/calculadora-rer",
        "/calculadora-mype",
        "/calculadora-recibos-por-honorarios",
        "/simulador-credito-personal",
        "/calculadora-credito-vehicular",
        "/calculadora-hipotecaria",
        "/comparador-de-prestamos",
        "/guias",
    ];

    public static IEndpointRouteBuilder MapSeo(this IEndpointRouteBuilder app)
    {
        app.MapGet("/sitemap.xml", GenerateSitemap).WithTags("SEO");
        app.MapGet("/robots.txt",  GenerateRobots) .WithTags("SEO");
        return app;
    }

    private static async Task<IResult> GenerateSitemap(
        HttpContext ctx,
        AppDbContext db,
        IConfiguration config,
        CancellationToken ct)
    {
        var baseUrl = config["SiteUrl"] ?? $"{ctx.Request.Scheme}://{ctx.Request.Host}";
        var hoy     = DateTime.UtcNow.ToString("yyyy-MM-dd");

        var sb = new StringBuilder();
        sb.AppendLine("""<?xml version="1.0" encoding="UTF-8"?>""");
        sb.AppendLine("""<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">""");

        foreach (var ruta in RutasEstaticas)
        {
            sb.AppendLine($"""
              <url>
                <loc>{baseUrl}{ruta}</loc>
                <lastmod>{hoy}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>{(ruta == "/" ? "1.0" : "0.8")}</priority>
              </url>
            """);
        }

        // Guías dinámicas desde DB
        var guias = await db.Guias
            .Where(g => g.Estado == "publicado")
            .Select(g => new { g.Slug, g.ActualizadoEn })
            .ToListAsync(ct);

        foreach (var guia in guias)
        {
            sb.AppendLine($"""
              <url>
                <loc>{baseUrl}/guias/{guia.Slug}</loc>
                <lastmod>{guia.ActualizadoEn:yyyy-MM-dd}</lastmod>
                <changefreq>monthly</changefreq>
                <priority>0.6</priority>
              </url>
            """);
        }

        sb.AppendLine("</urlset>");

        return Results.Content(sb.ToString(), "application/xml", Encoding.UTF8);
    }

    private static IResult GenerateRobots(IConfiguration config, HttpContext ctx)
    {
        var baseUrl = config["SiteUrl"] ?? $"{ctx.Request.Scheme}://{ctx.Request.Host}";
        var content = $"""
            User-agent: *
            Allow: /
            Disallow: /api/
            Disallow: /api/v1/admin/

            Sitemap: {baseUrl}/sitemap.xml
            """;
        return Results.Content(content, "text/plain");
    }
}
