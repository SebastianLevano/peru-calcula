# Perú Calcula

Plataforma web pública y gratuita de **calculadoras financieras, laborales y tributarias** según normativa peruana, orientada a alto tráfico orgánico (SEO), confiabilidad y escalabilidad.

> **Estado actual:** fase de diseño. El proyecto arranca por la documentación técnica; el código (Fase 0) se inicia tras la aprobación.

## Stack

- **Frontend:** Angular 21 (Standalone, Signals, Tailwind, Prerender/SSG)
- **Backend:** ASP.NET Core — monolito modular, Clean Architecture pragmática
- **Datos:** PostgreSQL + EF Core
- **Infra:** Docker / Docker Compose · CI/CD con GitHub Actions · cloud-agnóstico (AWS/Azure)

## Documentación

- 📄 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — documento técnico completo (visión, arquitectura, dominio, datos, APIs, SEO, seguridad, analítica, roadmap, MVP, riesgos).
- 🧭 [`docs/adr/`](./docs/adr/README.md) — 38 Architecture Decision Records.
- ⚖️ [`docs/normativa/`](./docs/normativa/README.md) — fuentes legales por calculadora (base de los golden tests y RAG futuro).

## Módulos

- **Laboral:** CTS, Gratificación, Vacaciones.
- **Tributario:** NRUS, RER, Régimen MYPE Tributario, Recibos por Honorarios.
- **Finanzas:** Crédito personal / vehicular / hipotecario, Comparador de préstamos.

## MVP (Fase 1)

Vertical slice: **CTS** · **Recibos por Honorarios** · **Crédito Personal**.
