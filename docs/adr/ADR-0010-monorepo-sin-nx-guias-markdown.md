# ADR-0010: Monorepo sin Nx + guías solo markdown sanitizado

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
Dos decisiones relacionadas con tooling/contenido:
1. El repo tiene **solo 2 apps** (web + api); una herramienta de monorepo pesada (Nx) no se justifica.
2. Las **guías** son contenido administrable; permitir HTML crudo abriría un vector **XSS**.

## Decisión
- **Monorepo simple** (carpetas + GitHub Actions con `paths:`), **sin Nx**.
- Las guías se almacenan y editan **solo como markdown sanitizado** (allowlist); **nunca HTML crudo**. Render seguro en el front.

## Consecuencias
- ✅ Versionado conjunto de contratos front/back; onboarding simple.
- ✅ Superficie XSS cerrada en contenido administrable.
- ⚠️ Markdown limita formato avanzado; aceptable para guías.
