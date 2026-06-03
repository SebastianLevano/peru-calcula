# Perú Calcula — Documento Técnico de Arquitectura

> **Versión:** 1.0 · **Fecha:** 2026-06-02 · **Estado:** Aprobado (base para Fase 0).
> **Stack inamovible:** Angular 21 + ASP.NET Core (monolito modular) + PostgreSQL/EF Core. **Sin microservicios.**
> Las decisiones de este documento se detallan como ADRs en [`docs/adr/`](./adr/README.md) (ADR-01…ADR-38).

---

## Context

**Por qué existe este documento.** Perú Calcula es un portal web público y gratuito para que trabajadores, independientes, emprendedores y MYPES peruanas realicen cálculos **financieros, laborales y tributarios** confiables. Es un **producto web real** orientado a **alto tráfico orgánico (SEO), monetización futura, autoridad temática y escalabilidad**, y a la vez una **demostración Full Stack profesional** (ADR-22).

**El reto es de producto y de rigor, no de complejidad distribuida.** Ejes de diseño:
1. **Exactitud normativa con datos cambiantes** sin redeploys → parametrización temporal + caché + admin.
2. **SEO de primera clase a bajo costo operativo** → **prerender/SSG** (no SPA-pura, no SSR caro) servido desde CDN.
3. **Confianza y responsabilidad legal** → cálculos versionados, con fuente/fecha/versión, disclaimer, y **cumplimiento Ley 29733**.
4. **Rendimiento bajo tráfico** → caché de parámetros, analytics asíncrono, cálculos stateless.
5. **Mantenibilidad y demostrabilidad** → fronteras de módulo enforced, testing formal, observabilidad.

**Decisiones de producto confirmadas:** Panel Admin web (auth admin) · MVP *vertical slice* (1 calculadora/módulo) · Analítica in-house (fuente de verdad de producto) + GA4 (solo marketing) · Monetización preparada, no implementada.

---

## 1. Visión del producto

| Aspecto | Definición |
|---|---|
| **Qué es** | Portal público de calculadoras financieras, laborales y tributarias + guías, para Perú. |
| **Para quién** | Trabajadores dependientes, independientes (4ta), emprendedores, MYPES. |
| **Propuesta de valor** | Cálculos correctos según normativa peruana, gratuitos, sin registro, con desglose, **fuente y fecha normativa visibles**, compartibles por URL y exportables a PDF. |
| **Modelo de uso** | Consulta anónima e inmediata; sin login de usuario final. |
| **Monetización (futura)** | AdSense, afiliación bancaria (comparador, con divulgación) y contenido patrocinado; espacios reservados desde el MVP. |
| **Diferenciador** | Calculadoras "reales" + señales de confianza + autoridad temática (guías) + cumplimiento de privacidad. |

**Principios:** Valor sobre complejidad · Rigor normativo · Rendimiento · SEO · Confianza/cumplimiento · Seguridad · Mantenibilidad enforced.

---

## 2. Arquitectura general

```
                        Internet (usuarios Perú)
                                │
                     ┌──────────▼──────────┐
                     │   CDN / Edge cache   │  ← HTML PRERENDERIZADO (SSG) + assets + sitemap
                     └──────────┬──────────┘
                                │
                ┌───────────────▼────────────────┐
                │   Angular 21 (Prerender/SSG)    │  apps/web
                │   - Rutas calc+guías a HTML build│  (ADR-13)
                │   - Hidrata a SPA (Signals)     │
                │   - Estado desde URL (ADR-14)   │
                │   - Consent banner (ADR-26)     │
                └───────────────┬────────────────┘
                                │  REST /api/v1 (JSON)
                ┌───────────────▼────────────────┐
                │   ASP.NET Core Web API          │  apps/api  (Monolito Modular — 4 assemblies)
                │   Api · Domain · Infrastructure · Shared
                │                                 │
                │   Domain (cálculo puro, por contexto):
                │     Laboral · Tributario · Finanzas        ← CORE
                │     Catálogo · Contenido · Analytics       ← SUPPORTING
                │     Admin/Identidad                        ← GENERIC
                │     Parámetros                             ← SHARED KERNEL
                │                                 │
                │   Cross-cutting:                │
                │     · ParametroService + IMemoryCache (ADR-24)
                │     · Analytics async: Channel + BackgroundService (ADR-25)
                │     · Serilog + Correlation IDs + HealthChecks (ADR-18)
                │     · Feature flags config-based (ADR-36)
                └────────────────┼─────────────────┘
                                 │  EF Core (migraciones controladas, ADR-27)
                       ┌─────────▼─────────┐
                       │   PostgreSQL       │  Parámetros·Bancos·Tasas·Guías(MD)
                       │   FTS guías (ADR-37)│  Analytics(+rollups)·Admin·Audit
                       │   PITR / DR (ADR-30)│
                       └────────────────────┘

  Transversal: GitHub Actions (CI: build/test/axe-core/NetArchTest) · Docker/Compose
  Futuro (prep, no impl.): SSR dinámico (F3) · OTel→Grafana/Loki · Afiliación bancaria · AI-tools
```

**Estilo:** Monolito modular, Clean Architecture pragmática. Un deploy de backend; fronteras de módulo **lógicas y enforced** (ADR-31). **Cálculos = funciones puras** (sin DB ni reloj), 100% testeables. La DB guarda parámetros, catálogo/tasas, guías, analítica y admin — **nunca PII del usuario final**.

---

## 3. Arquitectura frontend (Angular 21 — Prerender/SSG + hidratación SPA)

**Pilares:** Standalone · Signals · Tailwind · **Prerender/SSG (ADR-13)** · **estado en URL (ADR-14)** · **consentimiento (ADR-26)** · **WCAG 2.2 AA (ADR-34)**.

### Estructura
```
apps/web/src/app/
├── core/   ApiClient · SeoService · AnalyticsService · UrlStateService
│           ConsentService · FeatureFlagService · PdfService(F2)
├── shared/ UI (inputs, tablas, layout) · AdsSlot(placeholder) · TrustBadge · ResultCard · ConsentBanner
├── features/
│   ├── laboral/   cts/ gratificacion/ vacaciones/
│   ├── tributario/ nrus/ rer/ mype/ recibos-honorarios/
│   ├── finanzas/  credito-personal/ vehicular/ hipotecario/ comparador/
│   └── guias/     listado + detalle (contenido markdown sanitizado)
└── app.routes.ts (slugs SEO, todas prerenderizables)
```

### Patrones clave
- **Prerender/SSG (ADR-13):** todas las rutas de calculadora y guías se **prerenderizan a HTML en build** (prerender nativo de Angular 21) y se sirven indexables desde CDN; la página hidrata a SPA interactiva. SSR dinámico **no** se usa en F0/F1.
- **Estado desde la URL (ADR-14):** `UrlStateService` sincroniza inputs (`signal()`) ↔ query string y reconstruye el estado al cargar (`/calculadora-cts?basico=2000&hijos=1`). Botón "Compartir".
- **Cálculo en backend** (fuente única de verdad normativa); el front orquesta y formatea.
- **TrustBadge / ResultCard (ADR-20):** fecha de actualización normativa, fuente, versión de parámetros y disclaimer.
- **ConsentBanner + ConsentService (ADR-26):** GA4 y ads **bloqueados por defecto** hasta opt-in (Ley 29733). La analítica in-house anónima funciona sin PII.
- **AdsSlot (ADR-19):** placeholders reservados (AdSense/afiliados/patrocinado), vacíos en MVP; fijan layout (protege CLS).
- **PdfService (ADR-15, F2):** "Descargar PDF" **no bloqueante** (cliente-side o vía job de backend).
- **AnalyticsService (ADR-21):** embudo (inicio/completado/export PDF/click afiliado-futuro) → backend in-house; GA4 solo si hay consentimiento.
- **Accesibilidad (ADR-34):** target **WCAG 2.2 AA**, labels, foco, contraste; **axe-core en CI**.

### Rendimiento
Lazy loading por feature · `NgOptimizedImage` · fuentes `display: swap` · presupuesto de bundle en CI · slots reservados.

---

## 4. Arquitectura backend (ASP.NET Core)

**Clean Architecture pragmática** + monolito modular. **Arranca con 4 proyectos** (ADR-11): los módulos son **carpetas/namespaces** dentro de `Domain`; se extraen a assemblies propios **solo cuando el dolor lo justifique**.

### Solución .NET (inicial)
```
apps/api/
├── PeruCalcula.Api/             # Host: endpoints, middleware, DI, observabilidad, BackgroundServices, feature flags
├── PeruCalcula.Domain/          # Calculadoras PURAS + entidades + reglas, por contexto:
│                                #   Laboral/ Tributario/ Finanzas/ Catalogo/ Contenido/ Analytics/ Admin/
├── PeruCalcula.Infrastructure/  # EF Core (DbContext, configs, migraciones), repos, IMemoryCache, FTS, jobs
└── PeruCalcula.Shared/          # Money, Result<T>, contratos inter-módulo (DTOs/interfaces), abstracciones (IParametroService, IClock), constantes
```
> Extracción futura a `Modules.*` permitida sin reescritura, gracias a las reglas de dependencia (ADR-31).

### Convenciones
- **Calculadoras puras:** inputs validados + snapshot de parámetros vigentes → **resultado con desglose + metadatos de confianza**. `IClock` inyectado (sin `DateTime.Now` directo).
- **`Money` (ADR-29):** decimal + moneda + **política de redondeo centralizada** con estrategias nombradas por concepto (la norma peruana redondea distinto por cálculo). Ningún redondeo ad-hoc fuera de `Money`.
- **`Result<T>`** para errores de negocio; **FluentValidation** por request.
- **`ParametroService` + caché (ADR-24):** **cache-aside** con `IMemoryCache` de parámetros vigentes; **invalidación explícita** al editar parámetros desde admin. No golpea PostgreSQL en cada cálculo.
- **Versionado de cálculo:** respuesta con `parametrosVersion`, `fechaCalculo`, `fuente`, `fechaActualizacionNormativa` (ADR-20).
- **Reglas de dependencia inter-módulo (ADR-31):** comunicación **solo vía contratos en Shared o mediator**; **prohibidas** referencias cruzadas directas entre carpetas de módulo; **enforced por NetArchTest** en CI.
- **Concurrencia de edición admin (ADR-04):** optimistic concurrency con `xmin`/rowversion en `parametros` y `tasas_historicas` para evitar pisar ediciones; en el MVP de un solo admin el riesgo es bajo, pero el campo se incluye desde F1 para no migrar después.
- **OpenAPI/Swagger** para todos los endpoints.

### Background jobs (ADR-25)
- **Cola in-process** (`System.Threading.Channels` + `BackgroundService`) para **analytics asíncrono**: el endpoint encola fire-and-forget; un worker hace **batch insert**. **Sin Hangfire/Quartz** por ahora.
- Reutilizable para **generación de PDF no bloqueante** (ADR-15) y rollups (ADR-33).

### Observabilidad desde el MVP (ADR-18)
Serilog estructurado (JSON) · **Correlation IDs** por request · logging de errores centralizado → `ProblemDetails` · **Health checks** (`/health/live`, `/health/ready` con PostgreSQL). Abstracción lista para **OpenTelemetry → Grafana/Loki** (F4, no implementado).

### Migraciones en producción (ADR-27)
**Sin auto-migrate en startup.** Estrategia **expand/contract** (cambios compatibles hacia atrás), ejecución **controlada** como paso explícito del pipeline CD (job dedicado), con rollback plan. Seed de parámetros **como código** versionado.

### Middleware transversal
Rate limiting · Security headers · CORS · Correlation ID · Manejo global de errores · Serilog · Health checks · Consent gating.

---

## 5. Estructura del monorepo

```
peru-calcula/
├── apps/web/   (Angular 21, prerender/SSG)
├── apps/api/   (solución .NET: Api · Domain · Infrastructure · Shared)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── adr/                 # ADR-01 … ADR-38
│   └── normativa/           # fuentes legales por calculadora (estructurada para tests y RAG futuro)
├── docker/ (web.Dockerfile · api.Dockerfile · nginx opcional)
├── docker-compose.yml / docker-compose.prod.yml
├── .github/workflows/ (ci.yml: build/test/axe-core/NetArchTest · cd.yml: migración controlada + deploy)
├── .editorconfig · README.md
```
**Monorepo simple sin Nx (ADR-10):** solo 2 apps; workflows con `paths:`.

---

## 6. Modelo de dominio y Context Map (DDD)

### Context Map (ADR-32)
```
        ┌──────────── SHARED KERNEL ────────────┐
        │              Parámetros                │  (UIT, RMV, asig. familiar, topes, tasas — con vigencia)
        └───────┬───────────┬───────────┬────────┘
                │ conforms   │           │
   ┌────────────▼┐ ┌─────────▼─┐ ┌───────▼────────┐
   │  LABORAL    │ │TRIBUTARIO │ │   FINANZAS     │   ← CORE (ventaja competitiva)
   │ CTS·Grati·  │ │NRUS·RER·  │ │Créditos·       │
   │ Vacaciones  │ │MYPE·4ta   │ │Comparador(pilar)│
   └─────────────┘ └───────────┘ └────────────────┘
        ▲                ▲                ▲
        │ usa contratos  │                │
   ┌────┴──────┐  ┌───────┴─────┐  ┌───────┴──────┐
   │ CATÁLOGO  │  │ CONTENIDO   │  │  ANALYTICS   │   ← SUPPORTING
   │Bancos·Tasas│ │Guías (MD)   │  │Eventos+rollup│
   └───────────┘  └─────────────┘  └──────────────┘
                ┌───────────────────┐
                │  ADMIN / IDENTIDAD │                ← GENERIC
                └───────────────────┘
```
- **Core:** Laboral, Tributario, Finanzas (donde está el valor diferencial).
- **Shared Kernel:** **Parámetros** (formalizado), consumido por los tres core.
- **Supporting:** Catálogo, Contenido, Analytics.
- **Generic:** Admin/Identidad.

### Conceptos normativos (resumen)
> Montos/tasas *parametrizables* viven en `parametros` con vigencia + `fuente`; **no se hardcodean**.

**Laboral** — Rem. computable = básico + asig. familiar + promedios (≥3 meses) + 1/6 grati (CTS). **CTS** = `(RC/12)×meses + (RC/360)×días` (mayo/nov). **Gratificación** = `(RC/6)×meses` + bonif. extraordinaria 9% (EsSalud) ó 6.75% (EPS). **Vacaciones** 30 días/año (completas/truncas/pendientes). **Asig. familiar** = 10% RMV.
**Tributario** — **NRUS** Cat.1 (≤S/5,000→S/20)/Cat.2 (≤S/8,000→S/50), tope anual S/96,000. **RER** 1.5% ingresos netos, tope S/525,000. **RMT** ≤15 UIT→10%, exceso→29.5%; pagos a cuenta 1% si ≤300 UIT. **4ta** retención 8% si recibo >S/1,500; suspensión si proyección anual < umbral (UIT).
**Finanzas** — Francés `cuota = P·i·(1+i)^n/((1+i)^n−1)`, `i=TEM`, `TEM=(1+TEA)^(1/12)−1`. Cronograma (amortización/interés/saldo). **Comparador** ordena por **TCEA** (incluye comisiones); tasas referenciales con fecha; preparado para afiliación **con divulgación** (ADR-17).

---

## 7. Modelo de datos (PostgreSQL + EF Core)

> Solo datos de plataforma; **nunca PII del usuario final**.

| Tabla | Campos principales | Notas |
|---|---|---|
| **parametros** | `id, clave, descripcion, tipo, valor, moneda?, fuente, vigencia_desde, vigencia_hasta, xmin` | Vigencia temporal + `fuente`. Cacheado (ADR-24); seed como código (ADR-30). `xmin` para optimistic concurrency en edición admin (ADR-04). |
| **bancos** | `id, nombre, slug, logo_url, sitio_url, url_afiliado?, es_patrocinado, activo, orden` | `es_patrocinado` separa ranking orgánico de patrocinio (ADR-17). |
| **productos_financieros** | `id, banco_id, tipo, nombre, moneda, activo` | Comparable. |
| **tasas_historicas** | `id, producto_id, tea, tcea, comision_admin?, vigencia_desde, vigencia_hasta, fuente, es_referencial, xmin` | Histórico no destructivo. `xmin` para optimistic concurrency en edición admin (ADR-04). |
| **guias** | `id, slug, titulo, resumen, **cuerpo_markdown** (sanitizado), calculadora_relacionada?, meta_*, estado, publicado_en, actualizado_en` | **Markdown sanitizado, NUNCA HTML crudo (ADR-10/XSS)**. Búsqueda con **PostgreSQL FTS** (ADR-37). |
| **analytics_eventos** | `id, tipo_evento, calculadora_slug, modulo, fecha_utc, dispositivo (mobile\|desktop\|tablet), parametros_version` | Insert **asíncrono en batch** (ADR-25). `dispositivo` es **categoría derivada y no identificante**, nunca el user-agent crudo (ADR-26). Sin PII/IP cruda. **TTL** (ADR-33). |
| **analytics_rollups_diarios** | `fecha, calculadora_slug, modulo, inicios, completados, export_pdf, clicks_afiliado` | **Rollups desde F1** (ADR-33); fuente de los dashboards. |
| **admin_users** | `id, email, password_hash, rol, activo, ...` | Hash BCrypt/Argon2. |
| **admin_refresh_tokens** | `id, admin_user_id, token_hash, expira_en, revocado_en?, creado_en, user_agent?, ip_hash?` | Refresh tokens **persistidos y revocables** (ADR-08): rotación en cada uso, revocación en logout y al cambiar password; `token_hash` (nunca el token en claro). |
| **audit_log** | `id, admin_user_id, accion, entidad, entidad_id, datos_json, fecha` | **Retención mayor** (ADR-33). |

**Índices:** `parametros(clave, vigencia_desde)`, `tasas_historicas(producto_id, vigencia_desde)`, `guias(slug)` + índice GIN FTS, `analytics_eventos(tipo_evento, calculadora_slug, fecha_utc)`, `analytics_rollups_diarios(fecha, calculadora_slug)`, `admin_refresh_tokens(admin_user_id, token_hash)`.

---

## 8. APIs REST

Base `/api/v1`. Cálculos = `POST` **stateless** con desglose + metadatos de confianza. Errores `ProblemDetails`.

- **Laboral/Tributario/Finanzas:** `POST /laboral/{cts|gratificacion|vacaciones}` · `POST /tributario/{nrus|rer|mype|recibos-honorarios}` · `POST /finanzas/{credito-personal|credito-vehicular|credito-hipotecario}` · `GET /finanzas/comparador?...` (ordenado por TCEA, ranking vs patrocinio separados) · `GET /catalogo/{bancos|productos}`.
- **Contenido:** `GET /guias` · `GET /guias/{slug}` · `GET /guias/buscar?q=` (FTS).
- **Analytics:** `POST /analytics/evento` (encola async, sin PII).
- **SEO:** `GET /sitemap.xml` (índice; rutas estáticas desde build + guías desde backend) · `GET /robots.txt`.
- **Admin (JWT):** `POST /admin/auth/login` · `POST /admin/auth/refresh` (rota el refresh) · `POST /admin/auth/logout` (revoca) · CRUD `/admin/{bancos|productos|tasas|parametros|guias}` (parámetros → **invalida caché**; concurrencia con `xmin`) · `GET /admin/analytics/dashboard` (sobre rollups).

**Contrato de cálculo (conceptual):**
```jsonc
{
  "resultado": { "montoFinal": 1234.56, "moneda": "PEN" },
  "desglose": [ { "concepto": "Remuneración computable", "valor": 1500.00 } ],
  "formula": "CTS = (RC/12)×meses + (RC/360)×días",
  "confianza": {
    "parametrosVersion": "2026-06", "fechaActualizacionNormativa": "2026-01-15",
    "fuente": "D.Leg. 650 / SUNAT",
    "disclaimer": "Cálculo referencial. No constituye asesoría legal."
  }
}
```

---

## 9. Estrategia SEO

SEO de primera clase **a bajo costo operativo** (ADR-13) + **topic authority** (ADR-16).

- **Prerender/SSG (build):** todas las rutas de calculadora y guías se generan como **HTML estático indexable** y se sirven desde CDN. Sin SSR caro en F0/F1.
- **Sitemap en build/backend (no desde la SPA):** rutas estáticas conocidas en build + guías dinámicas desde el backend, combinadas en un sitemap index. `robots.txt` servido.
- **URLs slug por intención:** `/calculadora-cts`, `/calculadora-gratificacion`, `/calculadora-vacaciones`, `/calculadora-rus`, `/calculadora-rer`, `/calculadora-mype`, `/calculadora-recibos-por-honorarios`, `/simulador-credito-personal`, `/calculadora-credito-vehicular`, `/calculadora-hipotecaria`, `/comparador-de-prestamos`, `/guias/...`.
- **Metadata + JSON-LD** (`SoftwareApplication`, `FAQPage`, `BreadcrumbList`) inyectados en el HTML prerenderizado.
- **URLs compartibles (ADR-14):** mejoran CTR y enlaces entrantes.
- **Guías (ADR-16):** contenido markdown sanitizado, búsqueda FTS, enlaces internos hacia calculadoras → autoridad temática.
- **SSR dinámico → F3 solo si hace falta** (ADR-13). **CWV** vigilados; slots de ads reservados protegen CLS.

---

## 10. Estrategia de seguridad y cumplimiento

- **Consent / Ley 29733 (ADR-26):** GA4 y ads **bloqueados hasta opt-in**; banner de consentimiento; analítica in-house anónima sin PII.
- **XSS en guías (ADR-10):** solo **markdown sanitizado** (allowlist), nunca HTML crudo administrable; render seguro en front.
- **Auth admin (ADR-08):** **access token JWT corto** + **refresh token persistido y revocable** (`admin_refresh_tokens`). Rotación del refresh en cada uso; revocación inmediata en logout y al **cambiar password** (un token comprometido se corta antes de expirar); hash BCrypt/Argon2 de credenciales. Sin auth de usuario final.
- **Protección de API pública / anti-scraping (ADR-23):** **rate limiting por IP** + **límite de payload** + detección de patrones de **bulk**; CAPTCHA solo en login admin, **no** en endpoints públicos. Decisión consciente: los datos del comparador son semi-públicos por naturaleza.
- **Rate limiting** nativo (por IP), estricto en login admin.
- **Validación** FluentValidation; **inyección** evitada (EF parametrizado).
- **Security headers:** HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`.
- **CORS** allowlist; **Secretos** en Secrets Manager/Key Vault; **TLS** obligatorio.
- **Auditoría** `audit_log` (retención mayor). Revisión de seguridad antes de prod.

---

## 11. Analítica y producto

Privacidad por diseño; **analítica in-house = fuente de verdad de producto; GA4 solo marketing** (ADR-06/ADR-20).

### North Star (ADR-21): "Cálculos completados"
Embudo: **inicio → completado → export PDF → click afiliado (futuro)**.

### Implementación
- **In-house (PostgreSQL):** eventos **encolados async + batch insert** (ADR-25); **rollups diarios desde F1** (ADR-33) que alimentan el dashboard (calculadoras más usadas, volumen, tendencias, **tasa de completado**).
- **Retención/costos (ADR-33):** TTL de eventos crudos, rollups perdurables, `audit_log` con retención mayor, **presupuesto mensual target + alertas de costo**.
- **GA4 (cliente):** adquisición/SEO/marketing, **solo tras consentimiento** (ADR-26).

---

## 12. Roadmap por fases

| Fase | Objetivo | Entregables |
|---|---|---|
| **F0 — Cimientos** | Esqueleto + plataforma de calidad. | Monorepo · solución .NET **4 proyectos** · Angular 21 + **prerender/SSG** · Tailwind · Docker Compose · CI (**build/test/axe-core/NetArchTest** + **dependency scanning: Dependabot/equivalente**) · **estrategia de entornos dev/staging/prod (staging como gate antes de prod)** · EF Core + **migración controlada (ADR-27)** + **seed params como código** · **ParametroService + IMemoryCache (ADR-24)** · **analytics async (Channel+BG, ADR-25)** · **consent banner + gating (ADR-26)** · observabilidad (Serilog+CorrelationId+Health) · **feature flags (ADR-36)** · `UrlStateService` · AdsSlot/TrustBadge. |
| **F1 — MVP (vertical slice)** | 1 calculadora/módulo, end-to-end. | **CTS · Recibos por Honorarios · Crédito Personal** · prerender de sus rutas · SEO técnico + **sitemap build/backend** · estado en URL · señales de confianza · **golden tests por versión normativa (ADR-28)** · North Star + **rollups diarios** · **panel admin mínimo** (login con **refresh tokens revocables (ADR-08)**; params/tasas con invalidación de caché y `xmin`) · **WCAG 2.2 AA** · PITR gestionado + **primera prueba de restore mínima (ADR-30)**. |
| **F2 — Laboral+Tributario + PDF + Guías** | Cobertura + contenido + diferenciadores. | Gratificación, Vacaciones · NRUS, RER, RMT · **PDF no bloqueante (ADR-15/25)** · **guías (markdown sanitizado) + FTS (ADR-37)** · **integration tests Testcontainers + e2e Playwright (ADR-28)** · **restore de backup verificado de extremo a extremo (ADR-30)**. |
| **F3 — Comparador (pilar) + SSR si hace falta** | Activo estratégico. | **Comparador** (personal/vehicular/hipotecario) por TCEA, **divulgación de afiliación + separación ranking/patrocinio (ADR-17)** · admin CRUD completo · **SSR dinámico solo si la indexación lo exige (ADR-13)** · prep afiliación. |
| **F4 — Escala, monetización, DR** | Crecimiento. | Activación AdSense/afiliados/patrocinado · CDN/caching afinado · **OTel→Grafana/Loki (ADR-18)** · **Backup/DR probado (ADR-30)** · alertas de costo · cloud productivo (AWS/Azure). |

---

## 13. MVP recomendado

**Vertical slice (prerenderizado)** con una calculadora por módulo:
1. **CTS** (Laboral) — alto volumen estacional; demuestra cálculo puro, parametrización y caché.
2. **Recibos por Honorarios** (Tributario) — valida umbrales por UIT y suspensión.
3. **Crédito Personal** (Finanzas) — autocontenido (monto/plazo/TEA → cuota + cronograma); el comparador se difiere a F3 sin bloquear el MVP.

**Incluye:** prerender/SSG + SEO técnico + sitemap, estado en URL, señales de confianza, **caché de parámetros**, **analytics async + rollups**, **consent + gating**, observabilidad, **WCAG 2.2 AA**, panel admin mínimo, slots de monetización reservados.

**Criterio de éxito:** cálculos correctos y auditables; HTML prerenderizado indexable + sitemap; estado reconstruido desde URL; admin actualiza UIT/RMV **sin redeploy y con caché invalidada**; dashboard muestra "cálculos completados" y tasa de completado desde rollups; CI verde (tests + axe-core + NetArchTest).

---

## 14. Escalabilidad y riesgos técnicos

**Escalabilidad:** HTML estático en CDN (prerender) absorbe el grueso del tráfico de lectura; cálculos **stateless** escalables horizontalmente; **caché de parámetros** elimina lecturas repetidas a DB; **analytics async** saca la escritura del path del request; **rollups** acotan el crecimiento de datos.

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambios normativos | Cálculos desactualizados | Parametrización temporal + caché invalidable + admin sin redeploy. |
| Tasas bancarias desactualizadas | Comparador engañoso/legal | Referencial + fecha + disclaimer + histórico; divulgación de afiliación (ADR-17). |
| Responsabilidad legal | Reputacional/legal | Confianza (fuente/versión/fecha), disclaimers, tests vs casos normativos (`docs/normativa`). |
| Costo operativo de SEO | Sobrecosto/complejidad | **Prerender/SSG** (barato) en lugar de SSR; SSR solo si F3 lo exige (ADR-13). |
| DB como cuello de botella en cálculo | Latencia/picos | **Cache-aside de parámetros (ADR-24)**. |
| Escritura de analytics en el request | Latencia | **Cola async + batch (ADR-25)**. |
| Incumplimiento Ley 29733 | Legal | **Consent gating + banner (ADR-26)**. |
| Migraciones rompiendo prod | Caída | **Expand/contract, sin auto-migrate, ejecución controlada (ADR-27)**. |
| Acoplamiento entre módulos | Erosión arquitectónica | **Reglas inter-módulo enforced por NetArchTest (ADR-31)**. |
| XSS vía guías | Seguridad | **Markdown sanitizado, sin HTML crudo (ADR-10)**. |
| Errores de redondeo monetario | Cálculo incorrecto | **Política centralizada en `Money` (ADR-29)**. |
| Pérdida de datos | Negocio | **Backup/DR con PITR + restore probado (ADR-30)**. |
| Crecimiento de datos/costos | Sobrecosto | **Rollups + TTL + alertas (ADR-33)**. |
| Picos estacionales (CTS/grati) | Saturación | CDN + stateless + rate limiting + health checks/autoscaling. |

---

## 15. Decisiones arquitectónicas (ADRs)

El detalle de cada decisión está en [`docs/adr/`](./adr/README.md). Resumen:

| # | Decisión |
|---|---|
| ADR-01 | Monolito modular (no microservicios) |
| ADR-02 | Sin CQRS ni Event Sourcing |
| ADR-03 | Cálculos como funciones puras |
| ADR-04 | Parametrización temporal + optimistic concurrency |
| ADR-05 | *(Reemplazada por ADR-13)* SSR como objetivo |
| ADR-06 | Analítica in-house (verdad de producto) + GA4 (solo marketing) |
| ADR-07 | PostgreSQL + EF Core |
| ADR-08 | Auth admin: access JWT corto + refresh tokens revocables |
| ADR-09 | Panel Admin web |
| ADR-10 | Monorepo sin Nx + guías solo markdown sanitizado |
| ADR-11 | 4 assemblies iniciales; módulos = carpetas |
| ADR-12 | Cloud-agnóstico vía Docker |
| ADR-13 | Prerender/SSG estático (reemplaza ADR-05 y SPA-pura) |
| ADR-14 | URLs compartibles (estado en query string) |
| ADR-15 | Exportación PDF no bloqueante |
| ADR-16 | SEO de Topic Authority (`/guias`) |
| ADR-17 | Comparador como pilar + divulgación de afiliación |
| ADR-18 | Observabilidad desde el MVP |
| ADR-19 | Preparación para monetización |
| ADR-20 | Diferenciador de confianza |
| ADR-21 | North Star: "Cálculos completados" |
| ADR-22 | Estrategia de portafolio profesional |
| ADR-23 | Protección de API pública y postura ante scraping |
| ADR-24 | Cache Strategy (cache-aside IMemoryCache) |
| ADR-25 | Background Jobs (Channel + BackgroundService) |
| ADR-26 | Consent Management (Ley 29733) |
| ADR-27 | Migraciones EF en prod (expand/contract) |
| ADR-28 | Testing Strategy + golden tests por versión normativa |
| ADR-29 | Política de redondeo monetario en `Money` |
| ADR-30 | Backup & DR |
| ADR-31 | Reglas de dependencia inter-módulo |
| ADR-32 | Context Map + Shared Kernel |
| ADR-33 | Retención de datos y costos |
| ADR-34 | Accesibilidad WCAG 2.2 AA |
| ADR-35 | AI-Readiness (contrato describible) |
| ADR-36 | Feature Flags config-based |
| ADR-37 | Búsqueda con PostgreSQL FTS, no Elasticsearch |
| ADR-38 | Monolingüe español por diseño; i18n fuera de roadmap |

---

## Verificación / Cómo se valida la ejecución (al construir)

1. **Cálculos (ADR-28):** unit puro por calculadora vs casos en `docs/normativa/`; **golden/snapshot tests por versión normativa** (un cambio de UIT/RMV no altera el recálculo de periodos pasados); integración con **Testcontainers**; **NetArchTest** valida reglas inter-módulo; e2e **Playwright** mínimo. CI verde.
2. **Prerender/SEO (ADR-13):** verificar HTML estático con metadata/JSON-LD por ruta; `sitemap.xml` (build+backend) y `robots.txt` accesibles; Lighthouse SEO/Perf ≥ objetivo.
3. **Estado en URL (ADR-14):** cargar `/calculadora-cts?basico=2000&hijos=1` reconstruye formulario y resultado; "Compartir" copia la URL.
4. **Caché (ADR-24):** editar RMV/UIT en admin recalcula con el nuevo valor **sin redeploy** y se observa **invalidación**.
5. **Analytics async (ADR-25/33):** ejecutar cálculos; ver inicios/completados/PDF en `/admin/analytics/dashboard` desde **rollups**; inserts en batch (no en el path del request).
6. **Consent (ADR-26):** GA4/ads no cargan hasta opt-in; banner funcional.
7. **Observabilidad (ADR-18):** logs con Correlation ID por request; `/health/ready` verde con PostgreSQL.
8. **Migraciones (ADR-27):** deploy aplica migración como paso controlado del CD, no en startup.
9. **Accesibilidad (ADR-34):** axe-core sin violaciones críticas en CI.
10. **Auth admin (ADR-08):** tras logout o cambio de password, el refresh token previo queda **revocado**; el refresh **rota** en cada uso.
11. **API pública (ADR-23):** `GET /finanzas/comparador` aplica rate limiting/payload limit; un patrón de bulk se frena sin CAPTCHA en el endpoint público.
12. **Backup (ADR-30):** ejecutar la prueba de restore mínima (F1) sobre una instancia limpia y verificar integridad de parámetros/tasas.
13. **Seguridad:** headers/rate limiting verificados; guías rechazan HTML crudo (solo markdown sanitizado); `dispositivo` nunca almacena UA crudo.

---

### Próximos pasos
1. **Fase 0** — scaffolding del monorepo: 4 proyectos .NET, Angular prerender/SSG, Docker Compose, CI (axe-core/NetArchTest/Dependabot), entornos dev/staging/prod, caché, analytics async, consent, observabilidad, feature flags.
2. **Fase 1 (MVP)** — CTS, Recibos por Honorarios y Crédito Personal end-to-end.
