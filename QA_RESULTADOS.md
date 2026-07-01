# QA_RESULTADOS – Simulador ROI IBM Instana

**Versión auditada:** v0.2.1 (QA integral)  
**Fecha:** 2026-06-30  
**Autor:** QA Engineer + Claude Code

---

## Resumen ejecutivo

Se realizó auditoría integral de cálculos, consistencia de bloques, exportables, localStorage y cobertura de tests. Se detectaron y corrigieron **3 bugs de cálculo** y **1 bug de estado**, se creó un módulo de validación, 47 tests unitarios y este documento.

---

## Bugs encontrados y corregidos

### BUG-001 · Scores contaminados por bloques inactivos (CRÍTICO)

**Archivo:** `src/engine/calculator.ts` — función `calcScores()`  
**Descripción:** `costPressure`, `apmUtilization` y `coverageRestriction` usaban datos de `apmBlock` sin verificar si el bloque `commercial_apm` estaba activo. Lo mismo ocurría con `telemetryWaste` (que usaba `governanceBlock`) y `fragmentation` (que usaba `fragmentationBlock`).

**Impacto:** Un cliente sin APM comercial podía mostrar `costPressure = 75` y `coverageRestriction = 90` en sus scores simplemente por los valores por defecto del bloque, sin haber ingresado datos reales.

**Corrección:**
- `costPressure`, `apmUtilization`, `coverageRestriction` → `0` cuando `commercial_apm` no está activo ni es `startingPoint`
- `telemetryWaste` → `0` cuando `governance` no está en `activeBlocks`
- `fragmentation` → `0` cuando `fragmentation` no está en `activeBlocks`
- `operationalDrag` → parte de fragmentación gateada en `hasFragBlock`; incidentes siempre aplican
- `adoptionReadiness` → `50` (neutro) cuando OSS block no está activo

**Test de regresión:** `bug_regression_score_isolation` (3 tests)

---

### BUG-002 · Ahorro fantasma en gobierno de telemetría (ALTO)

**Archivo:** `src/engine/calculator.ts` — función `calcScenarioResult()`, línea ~177  
**Descripción:** El cálculo de `telemetrySavings` usaba `(state.openSourceBlock.monthlyInfraCost ?? 500) * 12`. El fallback `?? 500` creaba un "ahorro" de infraestructura de `$1,500/año` incluso cuando el bloque OSS no estaba activo y el campo estaba vacío.

**Impacto:** Escenarios sin open source mostraban ahorros de telemetría fantasmas de hasta ~$375/año (en escenario esperado) que inflaban artificialmente el beneficio anual.

**Corrección:** El ahorro de telemetría ahora requiere:
1. Bloque `governance` activo
2. Bloque `open_source` activo O `startingPoint === 'open_source'`
3. `openSourceBlock.monthlyInfraCost > 0`
4. `volScore > 0` (al menos un volumen de telemetría en nivel high/critical)

Si cualquiera de estas condiciones falla, `telemetrySavings = 0`.

**Test de regresión:** `bug_regression_governance_phantom_savings` (2 tests)

---

### BUG-003 · `loadDemo()` no limpiaba estado anterior (MEDIO)

**Archivo:** `src/App.tsx` — función `loadDemo()`  
**Descripción:** Al cargar los datos demo, se llamaba `setState(DEMO_STATE)` sin llamar `clearState()` antes. Si el usuario había ingresado datos propios y luego cargaba el demo, React actualizaba el estado en memoria pero el localStorage anterior no se limpiaba hasta el próximo `useEffect`. En navegaciones de vuelta podía quedar el estado anterior.

**Corrección:** `loadDemo()` ahora llama `clearState()` antes de `setState(DEMO_STATE)`.

---

### BUG-004 · `operationalDrag` aplicaba penalidad de `hasSingleServiceView` con peso incorrecto

**Archivo:** `src/engine/calculator.ts` — función `calcScores()`  
**Descripción:** La fórmula original multiplicaba `fragmentationBlock.hasSingleServiceView === 'no' ? 20 : 0` por `0.2`, lo que resulta en +4 puntos, pero luego sumaba con otros componentes sin ponderar bien. Al gatear por `hasFragBlock`, se corrigió la fórmula para ser `+4` directo cuando el bloque está activo.

---

## Módulo de validación creado

**Archivo:** `src/engine/validator.ts`  
**Función:** `validateScenario(state, results) → ValidationResult`

### Reglas implementadas

| ID | Severidad | Condición | Mensaje |
|----|-----------|-----------|---------|
| `missing_instana_cost` | ERROR | `instanaCosts.annualLicenseCost` null o 0 | Costo Instana obligatorio para calcular ROI |
| `missing_apm_cost` | WARNING | `startingPoint === 'commercial_apm'` y `apmBlock.annualCost` null | Sin costo APM no se puede calcular ahorro de racionalización |
| `inconsistent_starting_point` | INFO | `startingPoint === 'no_apm'` y bloque `commercial_apm` activo | Posible inconsistencia en punto de partida |
| `cost_driver_no_apm_cost` | WARNING | `evalDriver === 'cost_excessive'` y sin costo APM | Driver "costo excesivo" sin datos de referencia |
| `zero_benefit` | WARNING | ROI negativo y `totalAnnualBenefit === 0` | Beneficio $0 — posible falta de datos de impacto |
| `payback_exceeds_horizon` | WARNING | `horizon === 12` y `paybackMonths > 12` | Payback supera horizonte de evaluación |
| `replacement_no_apm_savings` | WARNING | `startingPoint === 'commercial_apm'` y `apmRationalizationSavings === 0` | Reemplazo sin ahorro de racionalización calculado |
| `no_active_blocks` | INFO | `activeBlocks.length === 0` | Análisis limitado a war rooms |

### Semántica de `canCalculateROI`
- `true` cuando no hay errores (`error` severity)
- Permite mostrar resultados con advertencias activas
- Solo bloquea con errores críticos (Instana cost faltante)

---

## Panel UI creado

**Archivo:** `src/components/Dashboard/ValidationPanel.tsx`  
**Comportamiento:**
- Aparece solo cuando hay issues (no visible si `issues.length === 0`)
- Colapsable con ▲/▼
- Color de banner: rojo (errores) → amarillo (advertencias) → azul (solo info)
- Cada issue muestra severidad, mensaje y sugerencia accionable
- Integrado en Dashboard.tsx inmediatamente antes del panel de interpretación ROI

---

## Tests unitarios

**Archivo:** `src/engine/__tests__/calculator.test.ts`  
**Framework:** Vitest 2.1.8  
**Cobertura:** 47 tests en 10 suites

| Suite | Tests | Descripción |
|-------|-------|-------------|
| `scenario_no_apm_low_impact` | 7 | Sin APM, bajo impacto, sin costo Instana |
| `scenario_no_apm_high_incidents` | 7 | Sin APM, incidentes bancarios críticos, ROI positivo |
| `scenario_apm_commercial_replacement` | 6 | Reemplazo APM con ahorros de racionalización |
| `scenario_apm_commercial_coexistence` | 3 | Coexistencia con doble costo en TCO |
| `scenario_open_source_high_tco` | 5 | OSS con alto costo infraestructura |
| `scenario_fragmented_tools` | 4 | 7+ herramientas por incidente |
| `scenario_negative_valid` | 6 | ROI negativo legítimo (bajo impacto) |
| `scenario_inconsistent_state` | 4 | `no_apm` + bloque APM activo |
| `bug_regression_governance_phantom_savings` | 2 | Confirma fix del ahorro fantasma |
| `bug_regression_score_isolation` | 3 | Confirma que scores no se contaminan |

**Resultado:** `47 passed (47)` ✓

---

## Validación de consistencia UI / Motor / Exportables

### Fuente única de verdad

`calculate(state)` se llama **una sola vez** en `App.tsx` y el resultado se pasa como prop:
- `Dashboard.tsx` recibe `results` → no recalcula
- `ExportButtons.tsx` recibe `results` → no recalcula
- `interpretROI(state, results)` → se llama en Dashboard y en exportables (Excel, PDF) con los **mismos** `results`
- `validateScenario(state, results)` → se llama solo en Dashboard con los **mismos** `results`

No hay recálculos paralelos. No hay divergencia posible entre UI y exportables.

### Regla de bloques inactivos

Los datos de un bloque desactivado son **ignorados** en:
- `calcScores()` — scores APM, telemetría, fragmentación → 0
- `calcScenarioResult()` — adminSavings, infraSavings, apmRationalizationSavings, fragmentationSavings, telemetrySavings
- `calcCurrentAnnualCost()` — costo APM y OSS no incluidos si bloque inactivo
- `calcConfidence()` — campos de bloques inactivos no cuentan para completitud

Los datos permanecen en `state` para no perder información si el usuario reactiva el bloque.

---

## Estado del build

```
tsc -b && vite build
✓ 906 modules transformed.
✓ built in 9.00s
```

Sin errores de TypeScript. Advertencia de chunk size (normal con xlsx + jsPDF + html2canvas).

---

## Items pendientes post-QA

- [ ] Editor de supuestos en tiempo real desde el dashboard
- [ ] Tooltips explicativos en campos clave
- [ ] PDF con gráficos embebidos (html2canvas)
- [ ] Validación visual de campos obligatorios en wizard (pasos 1-5)
- [ ] GitHub Pages deployment workflow
- [ ] Modo oscuro
