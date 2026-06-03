# ADR-0037: Búsqueda con PostgreSQL FTS, no Elasticsearch

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
La búsqueda de **guías** requiere full-text search en español. Introducir Elasticsearch añadiría un servicio extra a operar, sincronizar y costear, desproporcionado para el volumen de contenido.

## Decisión
Usar **Full-Text Search nativo de PostgreSQL** (con índice **GIN** y configuración de idioma español) para la búsqueda de guías. **Sin Elasticsearch.**

## Consecuencias
- ✅ Sin servicios adicionales; una sola fuente de datos.
- ✅ Suficiente para el volumen y la calidad de búsqueda esperados.
- ⚠️ Si el contenido creciera a una escala que lo exija, se reevaluará un motor dedicado (decisión revisable).
