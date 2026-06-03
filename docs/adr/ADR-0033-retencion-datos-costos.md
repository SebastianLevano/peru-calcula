# ADR-0033: Retención de datos y costos

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Los eventos crudos de analytics crecen sin límite y encarecen almacenamiento/consultas. Hay que acotar el crecimiento desde el inicio sin perder valor analítico.

## Decisión
- **Rollups diarios desde F1** (`analytics_rollups_diarios`) que alimentan los dashboards.
- **TTL** de eventos crudos (se purgan tras la ventana de rollup).
- `audit_log` con **retención mayor** (cumplimiento/auditoría).
- **Presupuesto mensual target + alertas de costo.**

## Consecuencias
- ✅ Crecimiento de datos acotado; consultas de dashboard rápidas (sobre rollups).
- ✅ Control de costos explícito.
- ⚠️ El detalle fino más antiguo que el TTL no es consultable: se acepta (los rollups bastan para tendencias).
