# ADR-0017: Comparador como pilar + divulgación de afiliación

- **Estado:** Aceptada · **Fecha:** 2026-06-02 · **Fase:** F3

## Contexto
El **comparador de préstamos** (personal, vehicular, hipotecario) es un activo estratégico y la principal vía de **monetización por afiliación** bancaria. La afiliación introduce un **conflicto de interés**: el orden patrocinado podría confundirse con mérito orgánico.

## Decisión
- El comparador ordena por **TCEA** (incluye comisiones), mostrando TEA, comisiones, cuota mensual e interés total; tasas referenciales con fecha de vigencia.
- Arquitectura preparada para afiliación (`url_afiliado`, tracking de clicks salientes).
- **Divulgación explícita del conflicto de interés** y **separación visual** entre ranking orgánico y patrocinio (`es_patrocinado`).

## Consecuencias
- ✅ Monetización sin sacrificar confianza ni transparencia.
- ✅ Cumple buenas prácticas de comparadores financieros.
- ⚠️ El patrocinio nunca debe alterar silenciosamente el orden orgánico: regla de producto.
