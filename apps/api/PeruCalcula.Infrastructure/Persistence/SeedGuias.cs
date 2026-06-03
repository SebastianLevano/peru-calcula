using PeruCalcula.Infrastructure.Persistence.Entities;

namespace PeruCalcula.Infrastructure.Persistence;

/// <summary>
/// Guías normativas iniciales. Ejecutar como paso explícito en CD (no en startup).
/// Cada guía enlaza a la calculadora relacionada y cita la fuente legal.
/// </summary>
public static class SeedGuias
{
    public static IReadOnlyList<Guia> Iniciales() =>
    [
        new()
        {
            Slug = "como-calcular-cts-peru",
            Titulo = "¿Cómo calcular tu CTS? Guía completa",
            Resumen = "Todo lo que necesitas saber sobre la Compensación por Tiempo de Servicios: quién tiene derecho, cómo se calcula la remuneración computable y cuándo se deposita.",
            CuerpoMarkdown = """
# ¿Cómo calcular tu CTS?

La **Compensación por Tiempo de Servicios (CTS)** es un beneficio social que funciona como seguro de desempleo. Se deposita dos veces al año y el saldo solo puedes retirarlo en ciertos porcentajes mientras estás en planilla.

## ¿Quiénes tienen derecho?

Todos los trabajadores del régimen laboral de la actividad privada con **más de un mes de servicios** tienen derecho a la CTS, siempre que trabajen al menos 4 horas diarias.

No tienen derecho a CTS: trabajadores del hogar, trabajadores a tiempo parcial (menos de 4 horas), trabajadores de regímenes especiales (agrario, micro empresa).

## ¿Cuándo se deposita?

| Período computable | Depósito |
|---|---|
| Noviembre – Abril | Hasta el 15 de mayo |
| Mayo – Octubre | Hasta el 15 de noviembre |

## ¿Cómo se calcula la remuneración computable?

La **remuneración computable (RC)** incluye:

- Remuneración básica mensual
- Asignación familiar (si aplica): 10% de la RMV
- Promedio de horas extras de los últimos 6 meses (si son regulares)
- Promedio de comisiones y bonos regulares de los últimos 6 meses
- **1/6 de la última gratificación recibida** (julio o diciembre)

> **Ejemplo:** Si ganas S/ 2,000 básico + S/ 102.50 de asignación familiar, tu RC base es S/ 2,102.50. Si tu última gratificación fue S/ 2,000, agregas S/ 333.33 (1/6). RC total: S/ 2,435.83.

## Fórmula de cálculo

```
CTS = (RC ÷ 12) × meses_completos + (RC ÷ 360) × días_adicionales
```

Los meses se cuentan desde el inicio del período (noviembre o mayo) hasta el último día antes del depósito. Las faltas injustificadas reducen el período computable.

## Efecto de las faltas injustificadas

Las inasistencias injustificadas descuentan días del período computable, reduciendo el monto final (Art. 18 D. Leg. 650).

## Fuente normativa

- **D. Leg. 650** — Texto Único Ordenado de la Ley de CTS (D.S. 001-97-TR)
- **D. Leg. 713** — para el cálculo de días
- **Ley 25129** — Asignación familiar

Calcula tu CTS exactamente con nuestra calculadora, que incluye el selector de período y los campos de variables mensuales.
""",
            CalculadoraRelacionada = "CTS",
            MetaTitle = "Cómo calcular la CTS en Perú 2026 — Guía con fórmula y ejemplos",
            MetaDescription = "Aprende a calcular tu CTS paso a paso: remuneración computable, 1/6 de gratificación, horas extras y períodos de depósito. Con fórmula y ejemplos reales.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "gratificacion-julio-diciembre-peru",
            Titulo = "Gratificación de julio y diciembre: guía completa",
            Resumen = "Cómo se calcula la gratificación ordinaria y la bonificación extraordinaria. Quiénes tienen derecho, qué incluye la remuneración computable y cuándo la recibes.",
            CuerpoMarkdown = """
# Gratificación de julio y diciembre en Perú

La gratificación es un beneficio laboral que equivale a **un sueldo completo por cada semestre** trabajado. Si trabajaste el semestre completo, recibes un sueldo en julio y otro en diciembre.

## ¿Quiénes tienen derecho?

Todos los trabajadores en planilla bajo el régimen laboral común. El trabajador debe tener **al menos un mes de servicios** en el semestre para tener derecho proporcional.

## Períodos y fechas de pago

| Gratificación | Período computable | Pago |
|---|---|---|
| Julio | Enero – Junio | Primera quincena de julio |
| Diciembre | Julio – Diciembre | Primera quincena de diciembre |

## ¿Qué incluye la remuneración computable?

- Remuneración básica
- Asignación familiar (si corresponde)
- Promedio de horas extras de los últimos 6 meses **si se percibieron en al menos 3 de los 6 meses** del semestre
- Promedio de comisiones y bonos regulares

Las bonificaciones extraordinarias, gratificaciones extraordinarias y condiciones de trabajo **no** se incluyen.

## Bonificación extraordinaria (9%)

Desde la Ley 29351 (2009), el empleador **no aporta al sistema de pensiones** sobre la gratificación. En cambio, ese monto (equivalente al 9% de la gratificación) se entrega al trabajador como **bonificación extraordinaria**.

```
Gratificación = RC × (meses_semestre / 6)
Bonificación extraordinaria = Gratificación × 9%
Total a recibir = Gratificación + Bonificación extraordinaria
```

Si aportas a EPS en lugar de EsSalud, el porcentaje de la bonificación es 6.75%.

## Efecto de las faltas injustificadas

Las inasistencias reducen el período semestral computable, disminuyendo la gratificación proporcional.

## Fuente normativa

- **Ley 27735** y su reglamento **D.S. 005-2002-TR**
- **Ley 29351** — Bonificación extraordinaria por gratificaciones

Usa nuestra calculadora de gratificación para obtener el monto exacto con tus datos reales.
""",
            CalculadoraRelacionada = "Gratificación",
            MetaTitle = "Cómo calcular la gratificación de julio y diciembre en Perú 2026",
            MetaDescription = "Guía completa sobre la gratificación peruana: fórmula, bonificación extraordinaria del 9%, qué incluye la remuneración computable y fechas de pago.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "vacaciones-ordinarias-truncas-peru",
            Titulo = "Vacaciones en Perú: ordinarias, truncas y pendientes",
            Resumen = "Guía sobre el derecho vacacional: cuándo nacen, qué pasa al cese, cómo se calculan las vacaciones truncas y cuándo pierdes el derecho.",
            CuerpoMarkdown = """
# Vacaciones en Perú: guía normativa completa

Los trabajadores en planilla tienen derecho a **30 días de descanso remunerado** por cada año completo de servicios.

## Vacaciones ordinarias

Para tener derecho a vacaciones necesitas haber cumplido **un año de servicios continuo** y acreditar un récord vacacional mínimo de días efectivos trabajados.

### ¿Cuándo nacen?

El derecho nace al cumplir el **aniversario laboral** (fecha de ingreso). El descanso debe gozarse en el año siguiente.

### Récord mínimo para el derecho vacacional

| Jornada | Días mínimos efectivos |
|---|---|
| 6 días a la semana | 260 días |
| 5 días a la semana | 210 días |

## Vacaciones truncas (al cese)

Cuando el trabajador cesa antes de cumplir el año, tiene derecho a una **compensación proporcional** por el tiempo trabajado desde el último aniversario.

```
Vacaciones truncas = RC mensual ÷ 30 × días_desde_último_aniversario
```

Se incluyen en la liquidación de beneficios sociales.

## Vacaciones pendientes

Si el trabajador no gozó sus vacaciones en el período correspondiente y aún está en planilla, esas vacaciones están pendientes y generan una deuda del empleador.

## Remuneración computable para vacaciones

La RC incluye básico, asignación familiar, y el promedio de las variables de los **últimos 12 meses** (horas extras, comisiones, bonos regulares).

## Pérdida del derecho vacacional

Si el trabajador acumuló **30 o más días de inasistencias injustificadas** en el año, **pierde el derecho** a las vacaciones de ese período (Art. 11 D. Leg. 713).

## Fuente normativa

- **D. Leg. 713** — Régimen de descansos remunerados
- **D.S. 012-92-TR** — Reglamento (Art. 12 y 23)

Nuestra calculadora distingue entre vacaciones ordinarias (empleado activo) y truncas (al cese), incluyendo el campo de fecha de cese para el cálculo exacto.
""",
            CalculadoraRelacionada = "Vacaciones",
            MetaTitle = "Vacaciones en Perú 2026: ordinarias, truncas y cómo calcularlas",
            MetaDescription = "Todo sobre el derecho vacacional en Perú: récord mínimo, vacaciones truncas al cese, pérdida del derecho por faltas y fórmula de cálculo. D. Leg. 713.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "recibos-honorarios-retencion-suspension",
            Titulo = "Recibos por honorarios: retención y suspensión de cuarta categoría",
            Resumen = "Cómo funciona la retención del 8% en recibos por honorarios, cuándo aplica y cómo solicitar la suspensión ante SUNAT si tus ingresos no superan las 7 UIT.",
            CuerpoMarkdown = """
# Recibos por honorarios: retención del 8% y suspensión

Los trabajadores independientes que emiten **recibos por honorarios** están sujetos a retención de impuesto a la renta de **cuarta categoría**.

## ¿Qué es la retención del 8%?

Cuando emites un recibo a una empresa (persona jurídica o persona natural con negocio), el pagador está **obligado a retenerte el 8%** del monto bruto y pagarlo a SUNAT a tu nombre.

**Ejemplo:** Emites un recibo por S/ 2,000. El cliente te paga S/ 1,840 y retiene S/ 160 que entrega a SUNAT.

## ¿Cuándo no aplica la retención?

No aplica cuando:
- El pagador es una persona natural sin negocio.
- El monto del recibo es menor a **S/ 1,500** (umbral para el ejercicio 2026; actualizar cuando SUNAT publique nuevo tope).
- Tienes una **constancia de suspensión** vigente.

## Suspensión de retenciones

Si estimas que tu **renta bruta anual de cuarta categoría no superará las 7 UIT** (S/ 37,450 en 2026), puedes solicitar a SUNAT la suspensión de retenciones y pagos a cuenta.

### ¿Cómo solicitar la suspensión?

1. Ingresa a **SUNAT Operaciones en Línea** (SOL) con tu RUC y clave.
2. Módulo: Trámites y Consultas → Suspensión de Retenciones 4ta Categoría.
3. SUNAT evalúa tu proyección anual. Si aprueba, te entrega una **Constancia de Autorización**.
4. Entrega la constancia a tu cliente para que no te retenga.

### Proyección anual

```
Renta bruta proyectada = Ingresos del mes × (12 / meses_transcurridos)
```

Si la proyección supera las 7 UIT, no calificas y debes tributar normalmente.

## Fuente normativa

- **Art. 74 del TUO de la LIR** (D.S. 179-2004-EF) — Retención de cuarta categoría
- **Art. 86 del TUO de la LIR** — Pagos a cuenta
- **Resolución de Superintendencia N° 013-2007/SUNAT** — Suspensión

Usa nuestra calculadora para saber si tu recibo está sujeto a retención y si calificas para suspensión.
""",
            CalculadoraRelacionada = "Recibos por Honorarios",
            MetaTitle = "Recibos por honorarios en Perú: retención 8% y suspensión SUNAT 2026",
            MetaDescription = "Aprende cómo funciona la retención del 8% en recibos por honorarios, cuándo puedes solicitar suspensión y cómo calcular si tus ingresos superan las 7 UIT.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "nuevo-rus-categorias-cuotas",
            Titulo = "Nuevo RUS: categorías, cuotas y quién puede acogerse",
            Resumen = "Todo sobre el Nuevo Régimen Único Simplificado (NRUS): categorías 1 y 2, cuotas mensuales, límites de ingresos y qué actividades están excluidas.",
            CuerpoMarkdown = """
# Nuevo RUS: el régimen más simple para pequeños negocios

El **Nuevo Régimen Único Simplificado (NRUS)** está diseñado para personas naturales con pequeños negocios que venden directamente al consumidor final.

## ¿Quién puede acogerse?

Personas naturales cuyos ingresos o compras mensuales **no superen S/ 8,000**. Deben vender solo a consumidores finales (no pueden emitir facturas).

### Actividades excluidas del NRUS

- Agentes de retención o percepción
- Quienes presten servicios de transporte de carga con vehículos de más de 2 toneladas
- Servicios notariales, martilleros, comisionistas, etc.
- Casinos y máquinas tragamonedas
- Agencias de viaje y publicidad

## Categorías y cuotas

| Categoría | Ingresos o compras mensuales | Cuota mensual |
|---|---|---|
| 1 | Hasta S/ 5,000 | S/ 20 |
| 2 | De S/ 5,001 hasta S/ 8,000 | S/ 50 |

La categoría se determina por el **mayor valor** entre ingresos y compras del mes.

**Ejemplo:** Si tuviste ingresos de S/ 4,500 y compras de S/ 5,200, debes tributar en la categoría 2 (S/ 50) porque las compras superaron S/ 5,000.

## ¿Qué incluye la cuota?

La cuota mensual del NRUS reemplaza al Impuesto a la Renta y al IGV. El negociante acogido no está obligado a llevar libros contables ni presentar declaraciones anuales de renta.

## Comprobantes que puede emitir

Solo **boletas de venta** y **tickets de máquina registradora**. No puede emitir facturas.

## Fuente normativa

- **D. Leg. 937** — Ley del Nuevo RUS
- **D. Leg. 967** — Modificaciones
- **Resolución de Superintendencia N° 029-2004/SUNAT**

Usa nuestra calculadora NRUS para determinar tu categoría y cuota exacta según tus ingresos y compras del mes.
""",
            CalculadoraRelacionada = "NRUS",
            MetaTitle = "Nuevo RUS en Perú 2026: categorías, cuotas y requisitos",
            MetaDescription = "Guía completa del Nuevo RUS: categorías 1 y 2, cuotas de S/ 20 y S/ 50, límites de ingresos y compras, y qué actividades están excluidas. D. Leg. 937.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "tcea-que-es-como-calcular",
            Titulo = "¿Qué es la TCEA y cómo compararla entre bancos?",
            Resumen = "La Tasa de Costo Efectivo Anual (TCEA) mide el costo real de un crédito incluyendo intereses y comisiones. Aprende cómo calcularla y por qué es mejor que comparar solo la TEA.",
            CuerpoMarkdown = """
# ¿Qué es la TCEA?

La **Tasa de Costo Efectivo Anual (TCEA)** es el indicador que muestra el **costo real total** de un crédito: incluye la tasa de interés (TEA) más todas las comisiones y gastos obligatorios asociados al préstamo.

## TEA vs TCEA: ¿cuál es la diferencia?

| Indicador | ¿Qué incluye? |
|---|---|
| **TEA** (Tasa Efectiva Anual) | Solo el interés puro |
| **TCEA** (Tasa de Costo Efectivo Anual) | Interés + comisiones + seguros obligatorios |

**Ejemplo:** Un banco puede ofrecer TEA del 20%, pero con una comisión mensual de S/ 15, la TCEA real puede ser del 23% o más. Otro banco con TEA del 22% pero sin comisiones puede tener una TCEA menor.

> **Regla de oro:** compara siempre por TCEA, no por TEA. La TCEA más baja = crédito más barato.

## ¿Cómo se calcula la TCEA?

La TCEA se calcula usando el método de Newton-Raphson: se encuentra la tasa que iguala el valor presente de todos los flujos (cuotas + comisiones + seguros) con el monto recibido.

La Resolución SBS N° 6523-2013 establece la metodología estándar que todos los bancos peruanos deben usar para calcular y publicar su TCEA.

## Crédito personal, vehicular e hipotecario

La TCEA aplica a todos los tipos de crédito:

- **Personal:** plazos típicos de 12 a 60 meses, TEA entre 15% y 90% según banco y perfil
- **Vehicular:** plazos de 24 a 84 meses, TEA generalmente entre 12% y 30%
- **Hipotecario:** plazos de hasta 30 años, TEA entre 7% y 12% (depende del programa)

## Sistema francés (cuota fija)

La mayoría de créditos en Perú usan el **sistema francés**: cuota mensual fija a lo largo de todo el plazo. Cada cuota incluye intereses (decrecientes) y amortización de capital (creciente).

```
TEM = (1 + TEA)^(1/12) - 1
Cuota = Monto × [TEM × (1 + TEM)^n] / [(1 + TEM)^n - 1]
```

## Fuente normativa

- **Resolución SBS N° 6523-2013** — Metodología para el cálculo de TCEA
- **Circular SBS G-185-2015** — Transparencia de información

Nuestro comparador de préstamos ordena por TCEA de menor a mayor para que elijas el crédito más económico del mercado peruano.
""",
            CalculadoraRelacionada = "Comparador de Préstamos",
            MetaTitle = "TCEA en Perú: qué es, cómo calcularla y comparar créditos 2026",
            MetaDescription = "Aprende la diferencia entre TEA y TCEA, por qué la TCEA es el indicador correcto para comparar créditos, y cómo se calcula según la Resolución SBS 6523-2013.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "regimen-especial-renta-rer",
            Titulo = "Régimen Especial de Renta (RER): quiénes pueden acogerse y cuánto pagan",
            Resumen = "Guía sobre el RER: tasa del 1.5% sobre ingresos netos, requisitos, límites, qué comprobantes puede emitir y cuándo conviene más que el NRUS o el RMT.",
            CuerpoMarkdown = """
# Régimen Especial de Renta (RER)

El **Régimen Especial de Renta (RER)** es para personas naturales y jurídicas con ingresos netos anuales que **no superen S/ 525,000**. Es más completo que el NRUS (puede emitir facturas) pero más simple que el Régimen General.

## Tasa y pago mensual

```
Impuesto mensual = Ingresos netos del mes × 1.5%
```

El pago mensual se hace mediante el PDT 621 o la Declaración Simplificada de SUNAT SOL. No hay declaración jurada anual de renta.

## ¿Quién puede acogerse?

- Personas naturales o jurídicas con ingresos netos anuales ≤ S/ 525,000
- Cuyo valor de activos fijos (excepto vehículos y predios) no supere S/ 126,000
- Que no superen 10 trabajadores por turno

### Actividades excluidas del RER

- Casinos, bingos y máquinas tragamonedas
- Agencias de viajes, transporte terrestre internacional
- Producción y comercialización de armas
- Venta de inmuebles
- Servicios de notarios
- Personas que tienen vinculación con empresas del régimen general

## Comprobantes que puede emitir

A diferencia del NRUS, en el RER puedes emitir **facturas, boletas y todos los comprobantes** permitidos por SUNAT.

## Libros contables obligatorios

- Registro de Compras
- Registro de Ventas

## RER vs NRUS vs RMT: ¿cuál elegir?

| Criterio | NRUS | RER | RMT |
|---|---|---|---|
| Ingresos máximos | S/ 96,000 anuales | S/ 525,000 anuales | Sin límite (hasta 1,700 UIT) |
| Puede emitir facturas | No | Sí | Sí |
| Tasa | Cuota fija S/ 20 o S/ 50 | 1.5% ingresos netos | 1% hasta 300 UIT, luego escala |
| Libros contables | Ninguno | 2 registros | Según ingresos |

## Fuente normativa

- **Art. 117 al 124 del TUO de la LIR** (D.S. 179-2004-EF)
- **D. Leg. 1086** — Modificaciones al RER

Usa nuestra calculadora RER para obtener tu impuesto mensual exacto ingresando solo tus ingresos netos del mes.
""",
            CalculadoraRelacionada = "RER",
            MetaTitle = "Régimen Especial de Renta (RER) en Perú 2026: tasa 1.5% y requisitos",
            MetaDescription = "Guía completa del RER: quiénes pueden acogerse, cómo se calcula el 1.5% sobre ingresos netos, libros obligatorios y cuándo conviene sobre el NRUS o el RMT.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
        new()
        {
            Slug = "regimen-mype-tributario-rmt",
            Titulo = "Régimen MYPE Tributario (RMT): pagos a cuenta y renta anual",
            Resumen = "Cómo funciona el Régimen MYPE Tributario: tasa del 1% hasta las 300 UIT, tramos de renta anual del 10% y 29.5%, y cuándo conviene sobre el RER o el régimen general.",
            CuerpoMarkdown = """
# Régimen MYPE Tributario (RMT)

El **Régimen MYPE Tributario** (creado por D. Leg. 1269) está diseñado para micro y pequeñas empresas con ingresos netos que **no superen las 1,700 UIT anuales** (S/ 9,095,000 en 2026).

## Pagos a cuenta mensuales

Los pagos a cuenta dependen del nivel de ingresos acumulados en el año:

| Ingresos acumulados | Tasa mensual |
|---|---|
| Hasta 300 UIT anuales (S/ 1,605,000) | 1.0% de ingresos netos del mes |
| Más de 300 UIT | 1.5% de ingresos netos del mes |

> La mayoría de MYPES peruana tributa al **1%** porque sus ingresos anuales no superan los S/ 1,605,000.

## Renta anual: dos tramos

Al cierre del ejercicio (declaración jurada anual), el impuesto se calcula sobre la **renta neta** (ingresos menos gastos deducibles):

| Renta neta imponible | Tasa |
|---|---|
| Hasta 15 UIT (S/ 80,250) | 10% |
| Exceso de 15 UIT | 29.5% |

Los pagos a cuenta mensuales se descuentan del impuesto anual.

## Ventajas sobre el Régimen General

- Tasa del 10% para la primera escala (vs 29.5% en régimen general)
- Libros contables simplificados para MYPES pequeñas
- Facilidades para acogimiento y cambio de régimen

## Libros contables según ingresos

| Ingresos anuales | Libros obligatorios |
|---|---|
| Hasta 300 UIT | Registro de Ventas, Registro de Compras, Libro Diario Simplificado |
| De 300 a 500 UIT | Agrega libro Mayor |
| Más de 500 UIT | Contabilidad completa |

## ¿Cuándo conviene el RMT?

El RMT conviene cuando:
- Tus ingresos anuales superan S/ 525,000 (límite del RER)
- Tienes gastos deducibles significativos (el RER no los considera, solo aplica 1.5% sobre ingresos brutos)
- Quieres escalar sin cambiar de régimen

## Fuente normativa

- **D. Leg. 1269** — Creación del Régimen MYPE Tributario
- **D.S. 403-2016-EF** — Reglamento
- **TUO de la LIR**, Art. 52-B

Calcula tu pago a cuenta mensual con nuestra calculadora RMT ingresando solo tus ingresos netos del mes.
""",
            CalculadoraRelacionada = "RMT",
            MetaTitle = "Régimen MYPE Tributario (RMT) en Perú 2026: pagos a cuenta y tramos",
            MetaDescription = "Guía completa del RMT: tasa del 1% hasta 300 UIT, tramos de renta anual 10% y 29.5%, libros contables y cuándo conviene sobre el RER. D. Leg. 1269.",
            Estado = "publicado",
            PublicadoEn = DateTimeOffset.UtcNow,
            ActualizadoEn = DateTimeOffset.UtcNow,
        },
    ];
}
