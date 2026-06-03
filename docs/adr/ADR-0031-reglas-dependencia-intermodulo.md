# ADR-0031: Reglas de dependencia inter-módulo

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
En un monolito modular con módulos como carpetas (ADR-0011), nada impide técnicamente una **referencia cruzada directa** entre módulos, lo que erosiona las fronteras y bloquea una futura extracción.

## Decisión
- La comunicación entre módulos ocurre **solo vía contratos en `Shared` o mediator**.
- **Prohibidas** las referencias cruzadas directas entre carpetas de módulo.
- Regla **enforced por NetArchTest** en CI (falla el build si se viola).

## Consecuencias
- ✅ Fronteras reales, no solo convención; extracción futura a assemblies sin reescritura.
- ✅ Acoplamiento controlado y verificable.
- ⚠️ Algún boilerplate de contratos en `Shared`: precio justo por la mantenibilidad.
