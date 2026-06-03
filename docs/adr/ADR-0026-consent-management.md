# ADR-0026: Consent Management (Ley 29733)

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Cargar **GA4** y **anuncios** sin consentimiento del usuario incumple la **Ley 29733** (Protección de Datos Personales, Perú). El diferenciador de privacidad exige coherencia.

## Decisión
- **Banner de consentimiento** + `ConsentService`; **GA4 y ads bloqueados por defecto** hasta **opt-in**.
- La **analítica in-house** es **anónima sin PII** y funciona sin consentimiento.
- El campo `dispositivo` de `analytics_eventos` es una **categoría derivada no identificante** (`mobile | desktop | tablet`), **nunca el user-agent crudo** (evita fingerprinting / dato personal).

## Consecuencias
- ✅ Cumplimiento legal y coherencia con el posicionamiento de privacidad.
- ✅ Métricas de producto sin depender del consentimiento.
- ⚠️ Las métricas de GA4 solo cubren a usuarios que aceptan: se asume.
