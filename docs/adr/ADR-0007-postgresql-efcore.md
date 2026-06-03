# ADR-0007: PostgreSQL + EF Core

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
El dominio persistente (parámetros con vigencia, bancos, tasas, guías, analítica) es **relacional**. Se requieren migraciones versionadas, queries parametrizadas (seguridad) y full-text search.

## Decisión
**PostgreSQL** como motor y **EF Core** como ORM con migraciones. Búsqueda de guías con **FTS nativo** (ADR-0037). Migraciones controladas en prod (ADR-0027).

## Consecuencias
- ✅ Relacional maduro, FTS integrado, PITR para DR (ADR-0030), cloud-agnóstico.
- ✅ EF Core parametriza queries → mitiga inyección.
- ⚠️ Cuidar N+1 y rendimiento de queries (revisión con `db-query-reviewer`).
