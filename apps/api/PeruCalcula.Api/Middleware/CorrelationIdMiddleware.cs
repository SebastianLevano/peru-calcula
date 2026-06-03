namespace PeruCalcula.Api.Middleware;

public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string Header = "X-Correlation-Id";

    public async Task InvokeAsync(HttpContext ctx)
    {
        if (!ctx.Request.Headers.TryGetValue(Header, out var id) || string.IsNullOrWhiteSpace(id))
            id = Guid.NewGuid().ToString("N");

        ctx.Items[Header] = id.ToString();
        ctx.Response.Headers[Header] = id.ToString();

        using (Serilog.Context.LogContext.PushProperty("CorrelationId", id.ToString()))
            await next(ctx);
    }
}
