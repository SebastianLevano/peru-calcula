# ADR-0006: Analítica in-house (verdad de producto) + GA4 (solo marketing)

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Se necesitan métricas de **producto** (uso de calculadoras, embudo de cálculo) sin almacenar PII, y métricas de **marketing/SEO** (adquisición, canales).

## Decisión
- **In-house en PostgreSQL** como **fuente de verdad de producto**: eventos anónimos agregados (ADR-0021), encolados async (ADR-0025), con rollups diarios (ADR-0033).
- **GA4** únicamente para marketing/SEO, cargado **solo tras consentimiento** (ADR-0026).

## Consecuencias
- ✅ Control total y privacidad en las métricas que guían el producto.
- ✅ Sin pipeline de datos pesado en el MVP.
- ⚠️ Dos fuentes de datos: roles claramente separados para evitar confusión.
