using System.Text;
using System.Threading.Channels;
using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Exporter;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using PeruCalcula.Api.BackgroundServices;
using PeruCalcula.Api.Telemetry;
using PeruCalcula.Api.Endpoints;
using PeruCalcula.Api.Middleware;
using PeruCalcula.Infrastructure;
using PeruCalcula.Shared.Contracts;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ─────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter()));

    // ── Infrastructure (DB, caché, parámetros, reloj, feature flags) ────────
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── JWT Auth (ADR-08) ─────────────────────────────────────────────────────
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("Jwt:Key no configurado.");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer           = true,
                ValidIssuer              = builder.Configuration["Jwt:Issuer"] ?? "PeruCalcula",
                ValidateAudience         = true,
                ValidAudience            = builder.Configuration["Jwt:Audience"] ?? "PeruCalcula",
                ClockSkew                = TimeSpan.FromSeconds(30),
            };
        });

    builder.Services.AddAuthorizationBuilder()
        .AddPolicy("admin", p => p.RequireRole("admin"));

    // ── Analytics async: Channel + BackgroundService (ADR-25) ────────────────
    var analyticsChannel = Channel.CreateBounded<AnalyticsEventoDto>(
        new BoundedChannelOptions(2000) { FullMode = BoundedChannelFullMode.DropOldest });
    builder.Services.AddSingleton(analyticsChannel);
    builder.Services.AddSingleton<IAnalyticsQueue, AnalyticsQueue>();
    builder.Services.AddHostedService<AnalyticsWorker>();
    builder.Services.AddHostedService<RollupWorker>();

    // ── Health Checks (ADR-18) ───────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddNpgSql(
            builder.Configuration.GetConnectionString("DefaultConnection")!,
            name: "postgres",
            tags: ["ready"]);

    // ── CORS ─────────────────────────────────────────────────────────────────
    builder.Services.AddCors(opt => opt.AddPolicy("Web", p =>
        p.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
         .AllowAnyMethod()
         .AllowAnyHeader()));

    // ── Rate Limiting (ADR-23) ────────────────────────────────────────────────
    builder.Services.AddRateLimiter(opt =>
    {
        opt.AddPolicy("api", ctx => RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                Window      = TimeSpan.FromSeconds(10),
                PermitLimit = 60,
                QueueLimit  = 0,
            }));
        opt.AddPolicy("admin-login", ctx => RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                Window      = TimeSpan.FromMinutes(1),
                PermitLimit = 5,
                QueueLimit  = 0,
            }));
        opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    // ── OpenTelemetry (ADR-18) ────────────────────────────────────────────────
    var otelEndpoint = builder.Configuration["OpenTelemetry:Endpoint"] ?? "http://otel-collector:4317";
    var otelEnabled  = builder.Configuration.GetValue<bool>("OpenTelemetry:Enabled", true);

    if (otelEnabled)
    {
        var resource = ResourceBuilder.CreateDefault()
            .AddService("peru-calcula-api", serviceVersion: "4.0.0");

        builder.Services.AddOpenTelemetry()
            .WithTracing(tracing => tracing
                .SetResourceBuilder(resource)
                .AddAspNetCoreInstrumentation(opt =>
                {
                    opt.RecordException       = true;
                    opt.EnrichWithHttpRequest = (activity, req) =>
                        activity.SetTag("http.correlation_id", req.Headers["X-Correlation-ID"].FirstOrDefault());
                })
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation(opt => opt.SetDbStatementForText = false)
                .AddOtlpExporter(opt =>
                {
                    opt.Endpoint = new Uri(otelEndpoint);
                    opt.Protocol = OtlpExportProtocol.Grpc;
                }))
            .WithMetrics(metrics => metrics
                .SetResourceBuilder(resource)
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation()
                .AddMeter(PeruCalculaMetrics.MeterName)
                .AddPrometheusExporter()
                .AddOtlpExporter(opt =>
                {
                    opt.Endpoint = new Uri(otelEndpoint);
                    opt.Protocol = OtlpExportProtocol.Grpc;
                }));

        builder.Services.AddSingleton<PeruCalculaMetrics>();
    }

    // ── OpenAPI ───────────────────────────────────────────────────────────────
    builder.Services.AddOpenApi();

    // ── ProblemDetails ────────────────────────────────────────────────────────
    builder.Services.AddProblemDetails();

    // ── FluentValidation ──────────────────────────────────────────────────────
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();

    var app = builder.Build();

    // ── Middleware pipeline ───────────────────────────────────────────────────
    app.UseMiddleware<CorrelationIdMiddleware>();

    app.Use(async (ctx, next) =>
    {
        ctx.Response.Headers["X-Content-Type-Options"]   = "nosniff";
        ctx.Response.Headers["X-Frame-Options"]          = "DENY";
        ctx.Response.Headers["Referrer-Policy"]          = "strict-origin-when-cross-origin";
        ctx.Response.Headers["Permissions-Policy"]       = "geolocation=(), microphone=(), camera=()";
        if (!app.Environment.IsDevelopment())
            ctx.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        await next();
    });

    app.UseExceptionHandler();
    app.UseStatusCodePages();

    app.UseCors("Web");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment())
        app.MapOpenApi();

    app.UseSerilogRequestLogging(opt =>
        opt.EnrichDiagnosticContext = (diag, ctx) =>
            diag.Set("CorrelationId", ctx.Items["X-Correlation-Id"]));

    // ── Health + métricas Prometheus ─────────────────────────────────────────
    app.MapHealthChecks("/health/live",  new() { Predicate = _ => false });
    app.MapHealthChecks("/health/ready", new() { Predicate = hc => hc.Tags.Contains("ready") });
    if (otelEnabled) app.MapPrometheusScrapingEndpoint("/metrics");

    // ── API Endpoints ────────────────────────────────────────────────────────
    app.MapLaboral();
    app.MapLaboralF2();
    app.MapTributario();
    app.MapTributarioF2();
    app.MapFinanzas();
    app.MapFinanzasF3();
    app.MapAnalytics();
    app.MapGuias();
    app.MapAdmin();
    app.MapSeo();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Aplicación terminó inesperadamente");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

return 0;
