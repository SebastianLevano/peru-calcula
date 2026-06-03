# ADR-0005: SSR como objetivo

- **Estado:** ⛔ Reemplazada por [ADR-0013](./ADR-0013-prerender-ssg.md) · **Fecha:** 2026-06-02

## Contexto
La versión inicial del diseño asumía Angular SSR como mecanismo para indexación SEO. Posteriormente se identificó que **SSR (render dinámico en servidor)** tiene un costo operativo considerable para un equipo pequeño, y que se confundía con **prerender/SSG** (barato).

## Decisión
**Reemplazada.** Ver ADR-0013: se adopta **prerender/SSG estático** en build; el SSR dinámico se difiere a F3 solo si la indexación lo exige.

## Consecuencias
- Esta decisión se conserva para trazabilidad histórica.
