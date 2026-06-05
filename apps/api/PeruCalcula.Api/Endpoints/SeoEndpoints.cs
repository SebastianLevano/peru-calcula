using System.Text;
using Microsoft.EntityFrameworkCore;
using PeruCalcula.Infrastructure.Persistence;

namespace PeruCalcula.Api.Endpoints;

public static class SeoEndpoints
{
    // Las 11 calculadoras: changefreq=weekly, priority=0.9
    private static readonly string[] RutasCalculadoras =
    [
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
    ];

    // Páginas legales: changefreq=yearly, priority=0.3
    private static readonly string[] RutasLegales =
    [
        "/privacidad",
        "/terminos",
        "/acerca",
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

        // Home: changefreq=daily, priority=1.0
        AppendUrl(sb, baseUrl, "/", hoy, "daily", "1.0");

        // Listado de guías (índice): changefreq=weekly, priority=0.7
        AppendUrl(sb, baseUrl, "/guias", hoy, "weekly", "0.7");

        // Calculadoras (11): changefreq=weekly, priority=0.9
        foreach (var ruta in RutasCalculadoras)
            AppendUrl(sb, baseUrl, ruta, hoy, "weekly", "0.9");

        // Guías dinámicas desde DB: changefreq=monthly, priority=0.8
        var guias = await db.Guias
            .Where(g => g.Estado == "publicado")
            .Select(g => new { g.Slug, g.ActualizadoEn })
            .ToListAsync(ct);

        foreach (var guia in guias)
            AppendUrl(sb, baseUrl, $"/guias/{guia.Slug}",
                      guia.ActualizadoEn.ToString("yyyy-MM-dd"), "monthly", "0.8");

        // Páginas legales: changefreq=yearly, priority=0.3
        foreach (var ruta in RutasLegales)
            AppendUrl(sb, baseUrl, ruta, hoy, "yearly", "0.3");

        sb.AppendLine("</urlset>");

        return Results.Content(sb.ToString(), "application/xml", Encoding.UTF8);
    }

    private static void AppendUrl(
        StringBuilder sb, string baseUrl, string ruta, string lastmod, string changefreq, string priority)
    {
        sb.AppendLine($"""
          <url>
            <loc>{baseUrl}{ruta}</loc>
            <lastmod>{lastmod}</lastmod>
            <changefreq>{changefreq}</changefreq>
            <priority>{priority}</priority>
          </url>
        """);
    }

    private static IResult GenerateRobots(IConfiguration config, HttpContext ctx)
    {
        var baseUrl = config["SiteUrl"] ?? $"{ctx.Request.Scheme}://{ctx.Request.Host}";
        var content = $"""
            User-agent: *
            Allow: /
            Disallow: /admin/
            Disallow: /api/

            Sitemap: {baseUrl}/sitemap.xml
            """;
        return Results.Content(content, "text/plain");
    }
}
