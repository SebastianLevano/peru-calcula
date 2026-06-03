# ADR-0019: Preparación para monetización

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
La monetización (AdSense, afiliados, contenido patrocinado) llegará más adelante, pero introducir espacios de anuncios tarde provoca **rediseños de layout** y degrada CLS (Core Web Vitals).

## Decisión
Reservar **slots de anuncios** (`AdsSlotComponent`) en el layout **desde el MVP**, renderizando vacíos. Fijan el espacio para AdSense / afiliados / patrocinado sin implementar monetización todavía.

## Consecuencias
- ✅ Activar monetización a futuro sin reescribir UI ni romper CLS.
- ✅ Layout estable y predecible.
- ⚠️ Espacios vacíos en MVP: se diseñan para no afectar la experiencia.
