# ADR-0028: Testing Strategy + golden tests por versión normativa

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
El riesgo real del dominio: cada cálculo es función de `(inputs, fecha, versión de parámetros)`. Un cambio futuro de UIT/RMV no debe **alterar silenciosamente** el recálculo de periodos pasados.

## Decisión
Pirámide de pruebas:
- **Unit puro** por calculadora contra **casos normativos reales** documentados en `docs/normativa/`.
- **Golden/snapshot tests fijados por versión normativa**: el resultado esperado se ancla a su fecha + versión de parámetros.
- **Integración** con **Testcontainers** (PostgreSQL real).
- **Arquitectura** con **NetArchTest** (reglas de ADR-0031).
- **E2E mínimo** con **Playwright**.

## Consecuencias
- ✅ Regresiones normativas detectadas de inmediato; corrección histórica garantizada.
- ✅ CI ejercita DB real y fronteras de módulo.
- ⚠️ Mantener los golden cases al introducir nuevas versiones de parámetros (esfuerzo deliberado).
