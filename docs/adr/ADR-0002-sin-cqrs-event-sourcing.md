# ADR-0002: Sin CQRS ni Event Sourcing

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
CQRS y Event Sourcing resuelven problemas de **escritura compleja, auditoría por eventos y modelos de lectura/escritura divergentes**. Perú Calcula no los tiene: la escritura se limita a parámetros, catálogo de tasas y contenido administrable.

## Decisión
**No** usar CQRS ni Event Sourcing. Servicios de aplicación simples sobre EF Core. La auditoría puntual se cubre con `audit_log` (ADR-0033).

## Consecuencias
- ✅ Menos código, menor curva de aprendizaje, mantenibilidad alta.
- ⚠️ Si en el futuro surge una necesidad real de proyecciones/event log, se evaluará localmente sin comprometer el resto del sistema.
