# ADR-0003: Cálculos como funciones puras

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
La **corrección de los cálculos es el activo crítico** del producto (responsabilidad legal, confianza). Cada cálculo es función de `(inputs, fecha, versión de parámetros)`.

## Decisión
Implementar las calculadoras como **funciones puras** en `PeruCalcula.Domain`: reciben inputs validados + snapshot de parámetros vigentes, devuelven un **resultado con desglose**. No acceden a DB ni al reloj (se inyecta `IClock`). El redondeo se centraliza en `Money` (ADR-0029).

## Consecuencias
- ✅ Deterministas y 100% testeables sin infraestructura.
- ✅ Habilitan golden tests por versión normativa (ADR-0028) y AI-readiness (ADR-0035).
- ⚠️ Los parámetros deben resolverse antes de invocar la calculadora (responsabilidad de la capa de aplicación + ADR-0024).
