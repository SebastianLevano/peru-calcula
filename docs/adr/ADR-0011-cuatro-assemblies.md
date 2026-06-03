# ADR-0011: 4 assemblies iniciales; módulos = carpetas

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Un assembly por módulo desde el día 1 genera **sobre-fragmentación** y fricción innecesaria para un equipo pequeño, sin beneficio real mientras las fronteras se respeten.

## Decisión
Arrancar con **4 proyectos**: `PeruCalcula.Api`, `PeruCalcula.Domain`, `PeruCalcula.Infrastructure`, `PeruCalcula.Shared`. Los **módulos** (Laboral, Tributario, Finanzas, Catálogo, Contenido, Analytics, Admin) son **carpetas/namespaces** dentro de `Domain`. Se extraen a assemblies propios (`Modules.*`) **solo cuando el dolor lo justifique**.

## Consecuencias
- ✅ Menos fricción de build/referencias; arquitectura clara.
- ✅ Las reglas de dependencia (ADR-0031) permiten extraer sin reescritura.
- ⚠️ La separación es lógica: depende de NetArchTest para no degradarse.
