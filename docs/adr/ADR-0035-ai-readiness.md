# ADR-0035: AI-Readiness (contrato describible)

- **Estado:** Aceptada · **Fecha:** 2026-06-02 · **Implementación:** ninguna ahora (solo preparación)

## Contexto
Es plausible que a futuro un asistente LLM invoque las calculadoras como **tools** o responda preguntas con RAG sobre la normativa. Prepararlo ahora es barato si se apoya en lo que ya existe.

## Decisión
- Cada calculadora expone un **contract/schema describible** (nombre, inputs tipados, descripción), **reutilizando los DTOs + reglas FluentValidation ya existentes** → apto como *tool definition* de un LLM.
- `docs/normativa/` se estructura para **RAG** (fuentes con fecha y versión).
- **Cero implementación de IA ahora**: solo el contrato describible y la estructura documental.

## Consecuencias
- ✅ Camino abierto a features de IA sin reescritura.
- ✅ Aprovecha artefactos existentes (DTOs/validación/golden cases).
- ⚠️ No añadir dependencias de IA al MVP: estrictamente preparación.
