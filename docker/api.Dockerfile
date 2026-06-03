FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY apps/api/PeruCalcula.sln .
COPY apps/api/PeruCalcula.Api/PeruCalcula.Api.csproj           PeruCalcula.Api/
COPY apps/api/PeruCalcula.Domain/PeruCalcula.Domain.csproj     PeruCalcula.Domain/
COPY apps/api/PeruCalcula.Infrastructure/PeruCalcula.Infrastructure.csproj PeruCalcula.Infrastructure/
COPY apps/api/PeruCalcula.Shared/PeruCalcula.Shared.csproj     PeruCalcula.Shared/

RUN dotnet restore PeruCalcula.sln

COPY apps/api/ .

RUN dotnet publish PeruCalcula.Api/PeruCalcula.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

COPY --from=build --chown=appuser:appgroup /app/publish .

USER appuser

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "PeruCalcula.Api.dll"]
