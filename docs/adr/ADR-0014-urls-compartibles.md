# ADR-0014: URLs compartibles (estado en query string)

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Un cálculo es valioso para compartir (WhatsApp, redes). Si el estado vive solo en memoria, no es compartible ni enlazable, y se pierde tráfico/SEO.

## Decisión
`UrlStateService` sincroniza los inputs (`signal()`) ↔ **query string**; la app **reconstruye el estado al cargar** (`/calculadora-cts?basico=2000&hijos=1`, `/simulador-credito-personal?monto=30000&plazo=48&tea=18`). Botón "Compartir" copia la URL.

## Consecuencias
- ✅ Mejor UX, compartibilidad, enlaces entrantes y señales de uso (SEO).
- ✅ Facilita soporte ("envíame tu URL").
- ⚠️ Los inputs van en claro en la URL: no se transmiten datos sensibles (solo parámetros de cálculo, sin PII).
