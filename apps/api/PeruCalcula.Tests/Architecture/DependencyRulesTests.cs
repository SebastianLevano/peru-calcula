using NetArchTest.Rules;
using Xunit;

namespace PeruCalcula.Tests.Architecture;

public class DependencyRulesTests
{
    private const string DomainNs        = "PeruCalcula.Domain";
    private const string InfrastructureNs = "PeruCalcula.Infrastructure";
    private const string SharedNs         = "PeruCalcula.Shared";
    private const string ApiNs            = "PeruCalcula.Api";

    [Fact]
    public void Domain_should_not_depend_on_Infrastructure()
    {
        var result = Types.InAssembly(typeof(PeruCalcula.Infrastructure.SystemClock).Assembly)
            .That().ResideInNamespace(DomainNs)
            .ShouldNot().HaveDependencyOn(InfrastructureNs)
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain no debe depender de Infrastructure");
    }

    [Fact]
    public void Domain_should_not_depend_on_Api()
    {
        var result = Types.InAssembly(typeof(PeruCalcula.Infrastructure.SystemClock).Assembly)
            .That().ResideInNamespace(DomainNs)
            .ShouldNot().HaveDependencyOn(ApiNs)
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain no debe depender de Api");
    }

    [Fact]
    public void Shared_should_not_depend_on_Domain_or_Infrastructure()
    {
        var sharedAssembly = typeof(PeruCalcula.Shared.Money).Assembly;

        var noDomain = Types.InAssembly(sharedAssembly)
            .ShouldNot().HaveDependencyOn(DomainNs)
            .GetResult();

        var noInfra = Types.InAssembly(sharedAssembly)
            .ShouldNot().HaveDependencyOn(InfrastructureNs)
            .GetResult();

        Assert.True(noDomain.IsSuccessful, "Shared no debe depender de Domain");
        Assert.True(noInfra.IsSuccessful, "Shared no debe depender de Infrastructure");
    }
}
