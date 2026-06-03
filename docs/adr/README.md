# Architecture Decision Records — Perú Calcula

Registro de decisiones arquitectónicas (ADR). Cada archivo documenta **Contexto**, **Decisión** y **Consecuencias**. Formato ligero estilo [MADR](https://adr.github.io/madr/).

Estados posibles: `Aceptada` · `Reemplazada` · `Propuesta` · `Diferida`.

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](./ADR-0001-monolito-modular.md) | Monolito modular (no microservicios) | Aceptada |
| [ADR-0002](./ADR-0002-sin-cqrs-event-sourcing.md) | Sin CQRS ni Event Sourcing | Aceptada |
| [ADR-0003](./ADR-0003-calculos-funciones-puras.md) | Cálculos como funciones puras | Aceptada |
| [ADR-0004](./ADR-0004-parametrizacion-temporal.md) | Parametrización temporal + optimistic concurrency | Aceptada |
| [ADR-0005](./ADR-0005-ssr-objetivo.md) | SSR como objetivo | Reemplazada (→ ADR-0013) |
| [ADR-0006](./ADR-0006-analitica-inhouse-ga4.md) | Analítica in-house (verdad de producto) + GA4 (marketing) | Aceptada |
| [ADR-0007](./ADR-0007-postgresql-efcore.md) | PostgreSQL + EF Core | Aceptada |
| [ADR-0008](./ADR-0008-auth-admin-refresh-revocable.md) | Auth admin: access JWT corto + refresh tokens revocables | Aceptada |
| [ADR-0009](./ADR-0009-panel-admin.md) | Panel Admin web | Aceptada |
| [ADR-0010](./ADR-0010-monorepo-sin-nx-guias-markdown.md) | Monorepo sin Nx + guías solo markdown sanitizado | Aceptada |
| [ADR-0011](./ADR-0011-cuatro-assemblies.md) | 4 assemblies iniciales; módulos = carpetas | Aceptada |
| [ADR-0012](./ADR-0012-cloud-agnostico-docker.md) | Cloud-agnóstico vía Docker | Aceptada |
| [ADR-0013](./ADR-0013-prerender-ssg.md) | Prerender/SSG estático (reemplaza ADR-0005) | Aceptada |
| [ADR-0014](./ADR-0014-urls-compartibles.md) | URLs compartibles (estado en query string) | Aceptada |
| [ADR-0015](./ADR-0015-pdf-no-bloqueante.md) | Exportación PDF no bloqueante | Aceptada |
| [ADR-0016](./ADR-0016-topic-authority-guias.md) | SEO de Topic Authority (`/guias`) | Aceptada |
| [ADR-0017](./ADR-0017-comparador-pilar-afiliacion.md) | Comparador como pilar + divulgación de afiliación | Aceptada |
| [ADR-0018](./ADR-0018-observabilidad-mvp.md) | Observabilidad desde el MVP | Aceptada |
| [ADR-0019](./ADR-0019-preparacion-monetizacion.md) | Preparación para monetización | Aceptada |
| [ADR-0020](./ADR-0020-diferenciador-confianza.md) | Diferenciador de confianza | Aceptada |
| [ADR-0021](./ADR-0021-north-star-metric.md) | North Star: "Cálculos completados" | Aceptada |
| [ADR-0022](./ADR-0022-estrategia-portafolio.md) | Estrategia de portafolio profesional | Aceptada |
| [ADR-0023](./ADR-0023-proteccion-api-publica.md) | Protección de API pública y postura ante scraping | Aceptada |
| [ADR-0024](./ADR-0024-cache-strategy.md) | Cache Strategy (cache-aside IMemoryCache) | Aceptada |
| [ADR-0025](./ADR-0025-background-jobs.md) | Background Jobs (Channel + BackgroundService) | Aceptada |
| [ADR-0026](./ADR-0026-consent-management.md) | Consent Management (Ley 29733) | Aceptada |
| [ADR-0027](./ADR-0027-migraciones-ef-prod.md) | Migraciones EF en prod (expand/contract) | Aceptada |
| [ADR-0028](./ADR-0028-testing-strategy-golden.md) | Testing Strategy + golden tests por versión normativa | Aceptada |
| [ADR-0029](./ADR-0029-redondeo-monetario.md) | Política de redondeo monetario en `Money` | Aceptada |
| [ADR-0030](./ADR-0030-backup-dr.md) | Backup & DR | Aceptada |
| [ADR-0031](./ADR-0031-reglas-dependencia-intermodulo.md) | Reglas de dependencia inter-módulo | Aceptada |
| [ADR-0032](./ADR-0032-context-map-shared-kernel.md) | Context Map + Shared Kernel | Aceptada |
| [ADR-0033](./ADR-0033-retencion-datos-costos.md) | Retención de datos y costos | Aceptada |
| [ADR-0034](./ADR-0034-accesibilidad-wcag.md) | Accesibilidad WCAG 2.2 AA | Aceptada |
| [ADR-0035](./ADR-0035-ai-readiness.md) | AI-Readiness (contrato describible) | Aceptada |
| [ADR-0036](./ADR-0036-feature-flags.md) | Feature Flags config-based | Aceptada |
| [ADR-0037](./ADR-0037-postgresql-fts.md) | Búsqueda con PostgreSQL FTS, no Elasticsearch | Aceptada |
| [ADR-0038](./ADR-0038-monolingue-espanol.md) | Monolingüe español por diseño; i18n fuera de roadmap | Aceptada |
