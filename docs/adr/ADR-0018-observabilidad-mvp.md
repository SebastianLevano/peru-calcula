# ADR-0018: Observabilidad desde el MVP

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Sin visibilidad operativa, depurar en producción es lento y arriesgado. Debe existir desde el inicio, pero sin sobrecargar el MVP con stacks completos de observabilidad.

## Decisión
Desde F0: **Serilog** estructurado (JSON), **Correlation IDs** por request, logging de errores centralizado → `ProblemDetails`, y **health checks** (`/health/live`, `/health/ready` con PostgreSQL). Abstracción de telemetría lista para **OpenTelemetry → Grafana/Loki** en F4 (no implementado aún).

## Consecuencias
- ✅ Trazabilidad por request desde el día 1.
- ✅ Migración a OTel sin reescritura.
- ⚠️ Grafana/Loki se posponen a F4 (no necesarios en MVP).
