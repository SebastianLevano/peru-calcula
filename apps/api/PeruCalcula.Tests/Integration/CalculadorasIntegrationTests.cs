using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace PeruCalcula.Tests.Integration;

[Collection("Integration")]
public sealed class CalculadorasIntegrationTests(IntegrationTestFixture fixture)
    : IClassFixture<IntegrationTestFixture>
{
    private readonly HttpClient _client = fixture.Client;

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Post_Cts_Returns_Ok_With_Desglose()
    {
        var body = new { remuneracionBasica = 3000, tieneHijos = true, mesesCompletados = 4, diasAdicionales = 15 };
        var resp = await _client.PostAsJsonAsync("/api/v1/laboral/cts", body);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("resultado").GetProperty("montoFinal").GetDecimal() > 0);
        Assert.True(json.GetProperty("desglose").GetArrayLength() > 0);
        Assert.Equal("D.Leg. 650 / SUNAFIL", json.GetProperty("confianza").GetProperty("fuente").GetString());
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Post_Cts_Invalid_Request_Returns_ValidationProblem()
    {
        var body = new { remuneracionBasica = -100, tieneHijos = false, mesesCompletados = 4, diasAdicionales = 0 };
        var resp = await _client.PostAsJsonAsync("/api/v1/laboral/cts", body);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Post_RecibosHonorarios_Returns_Suspension_Info()
    {
        var body = new { montoRecibo = 3000 };
        var resp = await _client.PostAsJsonAsync("/api/v1/tributario/recibos-honorarios", body);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("resultado").GetProperty("aplicaRetencion").GetBoolean());
        Assert.True(json.TryGetProperty("suspension", out _));
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Post_CreditoPersonal_Returns_Cronograma()
    {
        var body = new { monto = 10000, plazoMeses = 24, tea = 25 };
        var resp = await _client.PostAsJsonAsync("/api/v1/finanzas/credito-personal", body);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(24, json.GetProperty("cronograma").GetArrayLength());
        Assert.True(json.GetProperty("resultado").GetProperty("cuota").GetDecimal() > 0);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Post_Analytics_Evento_Returns_Accepted()
    {
        var body = new { tipoEvento = "inicio", calculadoraSlug = "cts", modulo = "laboral", dispositivo = "desktop" };
        var resp = await _client.PostAsJsonAsync("/api/v1/analytics/evento", body);

        Assert.Equal(HttpStatusCode.Accepted, resp.StatusCode);
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Get_Nrus_Returns_Categoria1()
    {
        var body = new { ingresosMensuales = 3000, comprasMensuales = 2000 };
        var resp = await _client.PostAsJsonAsync("/api/v1/tributario/nrus", body);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, json.GetProperty("resultado").GetProperty("categoria").GetInt32());
        Assert.Equal(20m, json.GetProperty("resultado").GetProperty("cuota").GetDecimal());
    }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task Health_Ready_Returns_Degraded_Without_Db_Ready()
    {
        // /health/live siempre OK; /health/ready requiere PostgreSQL (sí está disponible en test)
        var live  = await _client.GetAsync("/health/live");
        var ready = await _client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
    }
}
