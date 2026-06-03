# Normativa — fuentes legales y casos de referencia

Esta carpeta es la **fuente de verdad normativa** del proyecto. Cada calculadora documenta aquí:

- La **norma aplicable** (decreto/ley, artículo) y su **fuente** (SUNAT, MTPE, etc.).
- Los **parámetros vigentes** con su **fecha** y **versión** (UIT, RMV, asignación familiar, topes, tasas).
- **Casos de referencia (golden cases)** con inputs y resultado esperado, fijados por versión normativa.

Esta estructura alimenta:
- Los **golden/snapshot tests por versión normativa** ([ADR-0028](../adr/ADR-0028-testing-strategy-golden.md)) — un cambio futuro de UIT/RMV no debe alterar el recálculo de periodos pasados.
- La **AI-Readiness** ([ADR-0035](../adr/ADR-0035-ai-readiness.md)) — documentación estructurada para RAG.

## Organización sugerida

```
normativa/
├── laboral/
│   ├── cts.md
│   ├── gratificacion.md
│   └── vacaciones.md
├── tributario/
│   ├── nrus.md
│   ├── rer.md
│   ├── mype.md
│   └── recibos-honorarios.md
└── finanzas/
    └── creditos.md   # sistema francés, TEA→TEM, TCEA
```

## Plantilla por calculadora

```markdown
# <Calculadora>

## Norma
- Base legal: <decreto/ley, artículo>
- Fuente: <SUNAT/MTPE/…> · URL

## Parámetros (con vigencia)
| Parámetro | Valor | Vigencia desde | Fuente |
|---|---|---|---|

## Fórmula
<descripción + fórmula>

## Golden cases
| Caso | Inputs | Fecha / versión params | Resultado esperado |
|---|---|---|---|
```

> Los valores concretos (UIT, RMV, etc.) se cargan en la tabla `parametros` con su vigencia; aquí se documentan con su fuente para trazabilidad y testing.
