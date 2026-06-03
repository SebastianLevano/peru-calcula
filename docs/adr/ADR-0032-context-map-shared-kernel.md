# ADR-0032: Context Map + Shared Kernel

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Conviene clasificar los bounded contexts según su **valor estratégico** (DDD) para enfocar el esfuerzo donde está la ventaja competitiva y formalizar las dependencias.

## Decisión
Context Map explícito:
- **Core:** Laboral, Tributario, Finanzas (ventaja competitiva).
- **Supporting:** Catálogo, Contenido, Analytics.
- **Generic:** Admin/Identidad.
- **Shared Kernel:** **Parámetros**, consumido por los tres core (relación *conforms-to*).

## Consecuencias
- ✅ Enfoque de esfuerzo y calidad en el core.
- ✅ Parámetros formalizado como kernel compartido y estable.
- ⚠️ Cambios en el shared kernel impactan a varios contextos: se versiona y prueba con cuidado.
