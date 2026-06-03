# ADR-0015: Exportación PDF no bloqueante

- **Estado:** Aceptada · **Fecha:** 2026-06-02 · **Fase:** F2

## Contexto
Los usuarios quieren un **artefacto descargable** del cálculo (inputs, resultado, desglose, fecha, parámetros normativos, disclaimer). Generar PDF de forma síncrona en el path del request degrada latencia y escalabilidad.

## Decisión
Botón **"Descargar resultado PDF"** con generación **no bloqueante**: cliente-side o vía la **cola de background jobs** (ADR-0025). El PDF incluye inputs, resultado, desglose, fecha de cálculo, parámetros y disclaimer (ADR-0020).

## Consecuencias
- ✅ No impacta la latencia de los endpoints de cálculo.
- ✅ Refuerza confianza con un documento citable.
- ⚠️ Si es server-side, requiere gestión de la entrega del archivo generado.
