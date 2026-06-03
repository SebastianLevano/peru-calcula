# ADR-0020: Diferenciador de confianza

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Las calculadoras genéricas no transmiten confianza ni trazabilidad. El diferencial de Perú Calcula es la **credibilidad** del resultado.

## Decisión
Cada cálculo expone metadatos de confianza (`TrustBadge`/`ResultCard`): **fecha de actualización normativa**, **fuente** (norma/SUNAT), **versión de parámetros** y **disclaimer legal**. Presentes en la respuesta del API (`confianza`) y en el PDF (ADR-0015).

## Consecuencias
- ✅ Confianza superior a competidores; soporta la responsabilidad legal.
- ✅ Coherente con el versionado de cálculo (ADR-0004) y golden tests (ADR-0028).
- ⚠️ Exige mantener `fuente`/fechas actualizadas en `parametros`.
