# PROGRESO – Simulador ROI IBM Instana


## Release candidate local — Git inicializado ✓

**Fecha:** 2026-07-01  
**Commit inicial:** creado con mensaje `Initial release candidate - Instana ROI Simulator`

### Verificacion final

- `npm test` → 238 tests pasando en 10 archivos.
- `npm run build` → build limpio, 0 errores TypeScript.
- Warning conocido: chunk grande `vendor-charts` por Recharts.
- `git status --short` revisado antes del commit: no incluyo `node_modules`, `dist`, `.env`, exportables, presentaciones ni archivos privados de pricing.
- `.gitignore` reforzado para dependencias, build, variables de entorno, pricing local/privado, logs, temporales, exportables generados y materiales internos/Sellers/Partners.

### Limitaciones conocidas

- El simulador es una herramienta consultiva; no representa cotizacion oficial ni garantia financiera.
- Pricing Instana es referencial y editable; debe validarse con cotizacion oficial.
- No implementa mainframe, z/OS, MSU, VU, ShopZ ni Workload Pricer; esas menciones solo existen como exclusiones/disclaimers.
- Recharts permanece como chunk grande del dashboard.

### Proximos pasos

1. Crear repositorio en GitHub.
2. Configurar remoto.
3. Configurar GitHub Pages.
4. Ejecutar QA post-deploy.

---

## Estado actual: v0.5.1 — QA pricing Instana ✓

**Tests:** 238 pasando (10 archivos) · **Build:** limpio, 0 errores TS · **Fecha:** 2026-07-01

### Objetivo QA

Validar que el estimador referencial de costo Instana sea coherente, explicable y consistente entre UI, motor ROI, ReportModel, PDF y Excel.

### Escenarios QA ejecutados

- Modo manual con costo anual Instana 60000.
- SaaS Standard / APM con 50 MVS, precio mensual editable, 12 meses, sin add-ons.
- SaaS con mezcla Standard / APM + Essentials / IQM.
- SaaS con Data Ingest / Fair Use y overage.
- SaaS con Logs in Context por volumen, retencion y ceil de unidades.
- Self-Hosted con Logs in Context incluido por defecto y override manual.
- Synthetic Monitoring con IBM Hosted Public PoP.
- Synthetic con Customer Private PoP sin costo Managed PoP.
- Synthetic Self-Hosted sin costo Managed PoP.
- Descuento 20% y descuento alto mayor a 30%.
- MVS por debajo del minimo configurable.
- Busqueda estatica de exclusiones mainframe/z/OS/MSU/VU/ShopZ/Workload Pricer.
- Busqueda estatica de abreviatura visible "PS", enums internos y precios sensibles en componentes.

### Resultados

- Modo manual usa exactamente el costo anual manual como denominador ROI y ya no muestra lineas detalladas Standard/Essentials ni valores residuales del modo detallado.
- Modo detallado ignora cualquier costo manual previo y usa el total anual equivalente calculado.
- ReportModel ahora expone filas auditables para MVS, precios unitarios, meses, fair use, overage, retencion, unidades de logs, RU synthetic, descuentos, servicios y totales.
- Excel mantiene hoja "Costo Instana" y la alimenta desde `model.instanaCostRows`.
- PDF mantiene seccion "Estimacion referencial de costo Instana" y la alimenta desde `model.instanaCostRows`.
- No se encontro calculo mainframe/z/OS; las menciones existen solo como exclusiones o disclaimers.
- No se encontraron precios sensibles hardcodeados en componentes; los valores numericos de precios aparecen solo en tests.

### Errores encontrados y correcciones aplicadas

1. **Modo manual ambiguo en ReportModel**
   - Problema: el costo manual aparecia como `Base Standard / APM`, lo que podia interpretarse como desglose detallado.
   - Correccion: `buildInstanaCostRows` separa filas manuales y detalladas. Manual muestra `Fuente del costo: Ingresado manualmente` y `Costo anual manual`.

2. **Desglose exportable insuficiente para auditoria**
   - Problema: PDF/Excel mostraban totales, pero no todos los insumos requeridos: MVS, unit prices, fair use, overage, retencion, ejecuciones y RU.
   - Correccion: `InstanaCostBreakdown` agrega costos mensuales/unidades auditables y `instanaCostRows` incluye esos campos.

3. **Abreviatura visible "PS"**
   - Problema: un tooltip de servicios profesionales usaba la abreviatura "PS".
   - Correccion: texto reemplazado por "servicios" / "Servicios profesionales".

### Tests agregados o ajustados

- `instanaPricing.test.ts`: 19 tests, incluyendo manual sin mezcla, detailed ignorando costo manual, RU por tipo y override Self-Hosted logs.
- `reportModelPricing.test.ts`: valida filas manuales/detalladas, Data Ingest, Logs, Synthetic y ausencia de enums internos.
- `exportPricingModel.test.ts`: valida hoja Excel "Costo Instana" con mock de `xlsx`.
- `pricingQaScenarios.test.ts`: matriz de 9 escenarios QA de pricing/exportables.

### Limitaciones conocidas

- La generacion visual real de PDF se valida por contrato de ReportModel y build; no se inspecciono manualmente el PDF renderizado pagina por pagina en navegador.
- El warning de chunk grande `vendor-charts` permanece como limitacion conocida de Recharts.
- El estimador sigue siendo referencial: no contiene precios oficiales ni reemplaza cotizacion oficial.

---

## Estado actual: v0.5.0 — Estimador referencial de costo Instana ✓

**Tests:** 223 pasando (8 archivos) · **Build:** limpio, 0 errores TS · **Fecha:** 2026-06-30

### Cambios v0.5.0

- Nuevo modulo `src/engine/instanaPricing.ts` para calcular costo referencial de Instana desde variables editables.
- Nuevo modo manual/detallado en el Step 5: "Ingresar costo manual" o "Calcular costo referencial".
- Soporte distributed-only para SaaS y Self-Hosted / On-Premise.
- Lineas base combinables: Standard / APM y Essentials / IQM con MVS, precio mensual unitario y meses.
- Add-ons: Data Ingest / Fair Use, Logs in Context y Synthetic Monitoring / Managed PoP.
- Servicios: implementacion, capacitacion, servicios profesionales, operacion interna y coexistencia/transicion.
- Descuento referencial con advertencia para descuentos mayores a 30%.
- `ReportModel` incluye `instanaCostModel` e `instanaCostRows`; PDF y Excel consumen el modelo y no recalculan.
- Excel agrega hoja "Costo Instana". PDF agrega seccion "Estimacion referencial de costo Instana".
- Configuracion sample en `src/data/pricingConfig.ts`, marcada como referencial y sin precios oficiales.
- Documentacion tecnica nueva en `docs/instana-pricing-model.md`.

### Formulas principales

- `standardCost = standardMvsQty x standardMonthlyUnitPrice x standardMonths`
- `essentialsCost = essentialsMvsQty x essentialsMonthlyUnitPrice x essentialsMonths`
- `baseInstanaCost = standardCost + essentialsCost`
- `discountedBaseCost = baseInstanaCost x (1 - discountPercent / 100)`
- `monthlyDataIngestOverageGb = max(0, expectedMonthlyDataIngestGb - includedFairUseGb - dataIngestAddonGb)`
- `logsUnits = ceil(logsMonthlyGb / logsUnitSizeGb)` para SaaS
- `purchasedRuUnits = max(minimumRuUnitsMonthly, ceil(totalRuMonthly / ruUnitSize))` para IBM Hosted Public PoP
- `totalHorizon = discountedBaseCost + dataIngestCost + logsCost + syntheticCost + servicesCost + operationCost + coexistenceTransitionCost`
- `totalAnnual = totalHorizon / (months / 12)`

### Validaciones nuevas

- `instana_cost_zero`
- `mvs_below_minimum`
- `high_discount`
- `data_ingest_over_fair_use`
- `logs_addon_not_applicable_self_hosted`
- `synthetic_managed_pop_not_applicable`
- `pricing_reference_only`

Se mantiene compatibilidad con el ID legacy `missing_instana_cost`.

### Limitaciones

- No contiene precios oficiales. Los unit prices son editables y deben validarse con cotizacion oficial.
- No implementa z/OS, mainframe, MSU, VU, IBM Observability by Instana APM on z/OS, PID ESW, ShopZ ni Workload Pricer.
- Para Self-Hosted, Logs in Context puede tratarse como incluido o como costo manual de infraestructura/esfuerzo adicional.
- Managed PoP solo se calcula para SaaS con IBM Hosted Public PoP.

---

## Estado actual: v0.4.6 — QA + cierre formal para traspaso a Codex ✓ CERRADO

**Tests:** 183 pasando (5 archivos) · **Build:** limpio, 0 errores TS · **Tareas:** 0 abiertas
**Fecha de cierre:** 2026-06-30 · **Próxima acción:** módulo de pricing MVS/agente en Codex

---

## Cambios v0.4.6 — QA release candidate + correcciones

### Objetivo
Validar el simulador como release candidate local antes de publicación en GitHub Pages.
Auditoría completa: wizard, dashboard, exportables (PDF y Excel), responsive, performance, enums.

### Issues encontrados y corregidos

#### Bug #1 — Enum leakage en PDF: confidence strip
- **Archivo**: `src/export/pdf.ts` línea 167
- **Problema**: `model.confidenceLevelKey.toUpperCase()` → mostraba `HIGH`/`MEDIUM`/`LOW` en portada del PDF
- **Fix**: cambiado a `model.confidenceLevelShort` (`Alto`/`Medio`/`Bajo`)

#### Bug #2 — Enum leakage en intérprete: nombre de herramienta APM
- **Archivo**: `src/engine/interpreter.ts` líneas 77 y 387
- **Problema**: `apmBlock.tool` sin traducir → mostraba `dynatrace`, `newrelic`, `datadog` en descripciones de drivers y sugerencias de validación (visibles en PDF y Excel)
- **Fix**: `label(APM_TOOL_LABELS, apmBlock.tool, apmBlock.tool)` → muestra `Dynatrace`, `New Relic`, `Datadog`

#### Bug #3 — Enum leakage en intérprete: startingPoint fallback en narrativa
- **Archivo**: `src/engine/interpreter.ts` línea 496 (función `buildNarrative`)
- **Problema**: casos `basic_monitoring`, `multiple_tools`, `unknown` caían al fallback `punto de partida: ${state.profile.startingPoint}` mostrando el enum crudo en el `narrativeSummary` del PDF y Excel
- **Fix**: casos explícitos + `label(STARTING_POINT_LABELS, ...)` como último fallback

#### Bug #4 — Enum leakage en Excel: severity y category de drivers
- **Archivo**: `src/export/excel.ts` líneas 173 y 176
- **Problema**: `d.severity.toUpperCase()` → `CRITICAL`/`HIGH` en inglés; `d.category` → `cost`/`benefit`/`data`/`transition`/`context` en inglés en hoja "Interpretación ROI"
- **Fix**: mapas `SEVERITY_ES` y `CATEGORY_ES` con traducción española

### Performance — lazy loading de exportadores
- **Archivo**: `src/components/Export/ExportButtons.tsx`
- **Cambio**: importaciones estáticas `import { exportToPDF }` / `import { exportToExcel }` reemplazadas por `dynamic import()` en los handlers de clic
- **Archivo**: `vite.config.ts` — añadidos `manualChunks` para `jspdf`, `xlsx`, `html2canvas`, `recharts`
- **Resultado**: bundle principal reducido de **1411 KB → 163 KB** (gzip: 431 KB → 43 KB)
- **Impacto en UX**: sin cambios visibles — las librerías de exportación se descargan la primera vez que el usuario hace clic en "Exportar PDF" o "Exportar Excel" (1-2s adicionales solo en primera exportación)

### Escenarios QA validados (análisis de código estático + tests)

| Escenario | Resultado |
|---|---|
| 1. Sin APM | ✓ Modelo construye, ROI puede ser negativo, no crash |
| 2. APM comercial caro | ✓ apmRationalizationSavings > 0, label de herramienta en español |
| 3. APM con coexistencia | ✓ doubleCost capturado, TCO año 1 impactado |
| 4. Open source | ✓ infraSavings + adminSavings capturados |
| 5. Fragmentación | ✓ fragmentationSavings calculado, block combinable |
| 6. Datos incompletos | ✓ no throw, confianza baja, drivers informativos |
| 7. Supuestos personalizados | ✓ badge en portada PDF, aviso en sección supuestos |
| 8. ROI negativo | ✓ explanation profesional, isNegative = true, no oculta |
| 9. ROI positivo | ✓ badge verde, narrativa clara |
| 10. Demo + limpiar | ✓ loadDemo() reemplaza estado, reset() vuelve a DEFAULT_STATE |

### Checklist QA (análisis estático)

**Wizard**
- [x] Labels claros en todos los campos (sin valores de enum visibles)
- [x] Tooltips implementados (HelpTooltip en todos los campos principales)
- [x] Punto de partida es selección única (ToggleGroup exclusivo)
- [x] Bloques opcionales son combinables (activeBlocks array)
- [x] "Cargar demo" → setState(DEMO_STATE) + clearState()
- [x] "Limpiar" → confirm + setState(DEFAULT_STATE) + clearState()

**Dashboard**
- [x] ROI, payback, TCO se actualizan reactivamente (ReportModel en cada render)
- [x] Scores con interpretación en español (scoreInterpretation)
- [x] Lectura del resultado presente (ResultReading, ROIInterpretation)
- [x] Sin enums visibles en UI (todos mapeados en labels.ts / reportModel.ts)
- [x] Alertas del panel de validación cuando hay datos incompletos

**Exportables — PDF**
- [x] Portada con nombre de cliente, industria, fecha
- [x] Confidence strip en español (fix #1)
- [x] Gráfico ROI bidireccional (jsPDF, safeChart wrapper)
- [x] Gráfico TCO comparativo
- [x] Gráfico Ahorros por categoría
- [x] Gráfico Scores doble columna
- [x] Resumen ejecutivo claro (tabla + narrativa)
- [x] Lectura del resultado incluida
- [x] Supuestos incluidos (con badge si personalizados)
- [x] Recomendación consultiva incluida
- [x] Datos clave de entrada incluidos
- [x] Notas y advertencias incluidas
- [x] Sin enums en texto (fixes #1, #2, #3)
- [x] safeChart wrapper: PDF no se rompe si un gráfico falla

**Exportables — Excel**
- [x] 8 hojas: Resumen ejecutivo, Datos de entrada, Supuestos, Cálculos, Escenarios, Scores, Interpretación ROI, Recomendación
- [x] Severity y category de drivers en español (fix #4)
- [x] Supuestos incluidos con flag de personalización
- [x] Tipos de ROI en español (ROI_TYPE_LABELS)
- [x] Sin enums visibles en hojas de datos

**Performance**
- [x] Bundle principal: 1411 KB → 163 KB (gzip: 431 KB → 43 KB)
- [x] PDF libs (jsPDF + autotable): 399 KB → lazy loaded en primer clic
- [x] Excel libs (xlsx): 283 KB → lazy loaded en primer clic
- [x] Canvas libs (html2canvas): 202 KB → lazy loaded
- [⚠] Recharts (vendor-charts): 526 KB — cargado síncronamente (necesario para Dashboard). Limitación conocida; lazy loading requeriría refactor del Dashboard.

### Build y tests
- [x] `npm test` → 183 tests pasando (5 archivos) ✓
- [x] `npm run build` → 0 errores TypeScript ✓
- [x] Sin chunk vacíos generados ✓
- [x] Todas las tareas internas (#20–#25) cerradas ✓

### Limitaciones conocidas (no bloqueantes para release)
1. **Recharts bundle size** (526 KB): no lazy-cargado porque el Dashboard lo requiere síncronamente. Requeriría dividir Dashboard o usar Suspense.
2. **Gráficos PDF vs UI**: los gráficos del PDF son primitivas jsPDF (vector) — visualmente distintos a los charts Recharts de la UI. Esto es by design.
3. **html2canvas instalado pero no usado**: está en el bundle lazy `export-canvas` separado. Puede eliminarse en v0.5.x si no se usa para otra funcionalidad.
4. **Tests de primitivas jsPDF**: no cubiertos por suite (requieren JSDOM + canvas). Validación manual.
5. **Responsive**: no probado con viewport real de browser (sin acceso a UI en este entorno). El CSS usa CSS Grid/Flex responsivo.

---

## Estado anterior: v0.4.5 — PDF con gráficos ejecutivos ✓ CERRADO

---

## Cambios v0.4.5 — PDF ejecutivo con gráficos vectoriales

### Estrategia de gráficos
- **Dibujo programático con jsPDF** en lugar de html2canvas + captura DOM.
- Sin dependencia de DOM, sin problemas con SVG de Recharts, output crisp.
- PDF más ligero, robusto ante datos vacíos o parciales.
- Cada función gráfica tiene try/catch → si falla, el PDF se genera con nota de fallback.

### `src/export/pdfCharts.ts` (NUEVO)
- [x] `drawROIChart(doc, y, model)` — barras horizontales bi-direccionales por escenario (conservador/esperado/optimista), colores IBM, maneja ROI negativo
- [x] `drawTCOChart(doc, y, model)` — dos sub-barras por período (Actual rojo vs Instana azul) a 12/24/36m, badge de ahorro porcentual en teal
- [x] `drawSavingsChart(doc, y, model)` — barras horizontales por categoría de ahorro, proporcionales, % dentro de la barra, total al pie
- [x] `drawScoreChart(doc, y, model)` — dos columnas, 5 scores cada una, track gris + fill con color por categoría
- [x] `formatK(v, currency)` — helper de formateo K/M exportado y testeable
- [x] Placeholder elegante si no hay datos: `noData()` con mensaje contextual

### `src/export/pdf.ts` (MODIFICADO — refactor completo)
- [x] Importa las 4 funciones de gráfico desde `pdfCharts.ts`
- [x] `safeChart()` envuelve cada llamada con try/catch
- [x] Nueva estructura del PDF (10+ secciones):
  1. Portada + aviso de supuestos personalizados (nuevo aviso en portada)
  2. Resumen ejecutivo (tabla) + **Gráfico ROI** (nuevo)
  3. Lectura del resultado (narrativa, fuentes de valor, variables sensibles, recomendación)
  4. Perfil del cliente
  5. **Página de análisis visual**: Gráfico TCO comparativo + Gráfico Ahorros por categoría (nuevo)
  6. **Gráfico Scores visuales** (nuevo) + Tabla detallada de scores
  7. Resultados financieros + Desglose de ahorros (tabla)
  8. Supuestos de simulación (tabla)
  9. **Datos clave de entrada** (nuevo — subconjunto relevante de inputRows)
  10. Interpretación del resultado
  11. Recomendación consultiva + Tipos de ROI
  12. Notas y advertencias
- [x] ROI negativo: explicación profesional incluida, no oculta
- [x] Supuestos personalizados: aviso en portada + banda amarilla en sección supuestos
- [x] Sin recálculo en exportador — consume ReportModel

### `src/components/Export/ExportButtons.tsx` (MODIFICADO)
- [x] Label actualizado: "PDF: portada + resumen + gráficos ejecutivos + scores + interpretación + recomendación"

### `src/engine/__tests__/pdfExport.test.ts` (NUEVO — 21 tests)
- [x] formatK: 0, <1K, K, M, negativos, boundary
- [x] ReportModel → PDF: campos requeridos, ROI/payback, TCO, savings, scores
- [x] 6 escenarios QA: sin APM, APM comercial, open source, coexistencia, fragmentación, datos incompletos
- [x] ROI negativo: isNegative=true, explanation non-empty
- [x] assumptionsCustomized flag correcto
- [x] inputRows filtrados: secciones correctas, valores no vacíos

### Limitaciones documentadas
- Los gráficos del PDF son vectoriales (jsPDF) — distintos a los charts Recharts de la UI.
- html2canvas permanece instalado pero no se usa en el PDF (reservado para uso futuro).
- No hay tests de las primitivas de dibujo jsPDF porque requieren JSDOM+canvas (no configurado).

### Build y tests
- [x] `npm test` → 183 tests pasando (5 archivos) ✓
- [x] `npm run build` → 0 errores TypeScript, 0 warnings ✓
- [x] README.md actualizado con sección de gráficos PDF ✓
- [x] Todas las tareas internas (#14–#19) cerradas ✓

---

## Estado anterior: v0.4.4 — Tooltips contextuales completos ✓ CERRADO

---

## Cambios v0.4.4 — Sistema de ayuda contextual

### `src/content/helpTexts.ts` (NUEVO)
- [x] Diccionario centralizado `as const` con 8 secciones: `profile`, `scope`, `incidents`, `blocks`, `instanaCosts`, `dashboard`, `scores`, `scenarioEditor`
- [x] 60+ entradas, ninguna vacía. Sin duplicación en componentes.
- [x] Tipo exportado: `HelpTextSection`

### `src/components/UI/HelpTooltip.tsx` (NUEVO)
- [x] Componente `HelpTooltip` con props: `content`, `title?`, `placement? (top|bottom|right)`, `compact?`
- [x] Auto-flip: si `rect.top < 180`, cambia `top → bottom` para evitar salir del viewport
- [x] Interacciones: `onMouseEnter/Leave` (hover desktop), `onFocus/Blur` (teclado), `onClick` (toggle — mobile)
- [x] Accesibilidad: `aria-label="Ayuda"`, `aria-expanded`, `aria-controls={tooltipId}`, `role="tooltip"`, cierre con Escape y click fuera
- [x] Sin props inválidas de React (removidos `onMouseEnterCapture`/`onMouseLeaveCapture`)
- [x] Componente `InfoCallout` exportado para ayuda inline estática
- [x] CSS hover en `main.css`: `.help-btn:hover, .help-btn:focus-visible`

### `src/components/UI/FormField.tsx` (MODIFICADO)
- [x] Prop `help?: string` añadida a `FormField`, `SelectField`, `NumberField`, `TextField`, `ToggleGroup`
- [x] Fila de label cambiada a flex row con `HelpTooltip` inline cuando `help` está presente

### Wizard — cobertura por paso
- [x] **Step 1 Perfil**: industry, currency, horizon via `help={}` prop; startingPoint y evalDriver con `<HelpTooltip>` manual
- [x] **Step 2 Alcance**: appCount, criticality, operationHours, affectsExternalClients, processesEconomicTransactions, hasSlAorRegulatory
- [x] **Step 3 Incidentes**: incidentFrequency, mttd, mttr, rootCause, warRoomDuration, warRoomPeople, hourlyCost (manual)
- [x] **Step 4 Bloques**: los 8 bloques (commercial_apm, open_source, otel, governance, fragmentation, migration, slo_sla, security) con tooltip en toggle card
- [x] **Step 5 Costos**: annualLicense, internalOperation, logsAndSynthetic (×3), implementation, training, professionalServices

### `src/components/Dashboard/Dashboard.tsx` (MODIFICADO)
- [x] ROI highlight cards: roi, payback, grossBenefit, netBenefit
- [x] Metric cards: tcoActual, tcoInstana, grossBenefit, warRoomCost
- [x] Confianza del cálculo: confidence
- [x] Score bars (10 scores): costPressure, apmUtilization, coverageRestriction, operationalDrag, telemetryWaste, fragmentation, otelReadiness, migrationEffort, adoptionReadiness, roiConfidence — via `scoreKey` prop en `ScoreBar`

### `src/components/Dashboard/ScenarioEditor.tsx` (MODIFICADO)
- [x] Card title con `helpTexts.scenarioEditor.general`
- [x] Header de columna "Parámetro" con `helpTexts.scenarioEditor.minMax`
- [x] Botón "Restaurar defaults" con `helpTexts.scenarioEditor.restoreDefaults`
- [x] 6 param rows: mttrReduction, mttdReduction, warRoomReduction, adminReduction, coverageImprovement, fragmentationReduction

### `src/engine/__tests__/helpTextsValidation.test.ts` (NUEVO)
- [x] 65 tests: ningún texto vacío, secciones completas, 8 bloques, 10 scores, 8 métricas dashboard, 9 claves scenarioEditor

### Build
- [x] `npm test` → 162 tests pasando ✓
- [x] `npm run build` → 0 errores TypeScript ✓

---

## Estado anterior: v0.4.3 — QA del editor de supuestos

### Fixes en QA v0.4.3
- [x] **BUG-1 (crítico)**: `deepMerge` en `storage.ts` convertía arrays `[min, max]` a objetos `{0: min, 1: max}`, rompiendo el spread en Excel. Fix: `if (Array.isArray(overrides)) return overrides;`
- [x] **BUG-2**: `ScenarioEditor` — `parseInt('')` retornaba 0 silenciosamente. Fix: `if (isNaN(parsed)) return;`
- [x] **BUG-3**: `ScenarioEditor` — faltaba `import React` para `React.CSSProperties`
- [x] `ReportModel` con `assumptionsCustomized: boolean` — flag derivado sin duplicar lógica
- [x] PDF y Excel muestran banner de advertencia cuando supuestos son personalizados
- [x] ScenarioEditor: feedback visual (borde amarillo) cuando valor es auto-ajustado
- [x] ScenarioEditor: estado colapsado muestra "⚠ Usando supuestos personalizados"
- [x] Tests: `calculationWithCustomAssumptions.test.ts` (27 tests), `assumptionsValidation.test.ts` (15 tests)

---

## Estado anterior: v0.4.1 — QA de consistencia, labels completos y explicación diferenciada

---

## Cambios v0.4.1 — QA integral

### Labels completos (`src/utils/labels.ts`)
- [x] `DETECTION_TIME_LABELS`, `RESOLUTION_TIME_LABELS`, `COVERAGE_PERCENTAGE_LABELS`, `COST_CONCERN_LABELS`
- [x] Ningún enum interno visible en UI, PDF ni Excel — todo pasa por un mapa de labels

### Explicación diferenciada de ROI negativo (`src/engine/reportModel.ts`)
- [x] `buildReadingSection` genera texto específico según `startingPoint` y contexto de coexistencia:
  - Adopción inicial (`no_apm`, `basic_monitoring`): valor estratégico, mediano plazo
  - Reemplazo APM (`commercial_apm`): fracción conservadora de ahorro de licencias, no 100%
  - Transición OSS (`open_source`): TCO real requiere datos completos de infra + admin
  - Coexistencia (bloque migración + `hasDoubleCost === 'yes'`): doble costo impacta año 1
  - General: horizonte corto, supuestos conservadores, datos incompletos

### Nuevas reglas de validación (`src/engine/validator.ts`)
- [x] `tco_cost_advantage_uncaptured` (warning): TCO actual > Instana × 1.5 y ROI negativo
- [x] `apm_data_block_inactive` (warning): costo APM ingresado pero bloque inactivo y startingPoint ≠ commercial_apm

### `buildInputRows` expandido (`src/engine/reportModel.ts`)
- [x] Incluye `detectionTime` (`DETECTION_TIME_LABELS`), `resolutionTime` (`RESOLUTION_TIME_LABELS`)
- [x] Incluye `criticalAppsCoverage` (`COVERAGE_PERCENTAGE_LABELS`), `costConcern` (`COST_CONCERN_LABELS`)

### Excel sin fugas de enums (`src/export/excel.ts`)
- [x] Eliminadas filas duplicadas con enums crudos — todo proviene de `model.inputRows`
- [x] Importación `label` eliminada (ya no necesaria)

### Tests expandidos (`src/engine/__tests__/calculator.test.ts`)
- [x] Suite `validation_tco_cost_advantage_uncaptured` (4 tests)
- [x] Suite `validation_apm_data_block_inactive` (4 tests)

### Build
- [ ] `npm run build` y `npm test` — pendiente verificación (ejecutar a continuación)

---

### Consistencia UI / PDF / Excel — resumen

| Dato | Fuente en modelo | UI | PDF | Excel |
|---|---|---|---|---|
| Scores label + valor + interpretación | `model.scores[]` | ✓ | ✓ | ✓ |
| Tipos de ROI activos | `model.activeRoiTypeLabels[]` | ✓ | ✓ | ✓ |
| Resumen narrativo | `model.reading.narrativeParagraph` | ✓ | ✓ | ✓ |
| Explicación del ROI | `model.reading.explanation` | ✓ | ✓ | ✓ |
| Recomendaciones | `model.reading.recommendations[]` | ✓ | ✓ | ✓ |
| Fuentes de valor | `model.reading.valueSources[]` | ✓ | ✓ | — |
| Variables sensibles | `model.reading.sensitiveVars[]` | ✓ | ✓ | ✓ |
| Datos de entrada | `model.inputRows[]` | — | — | ✓ |

---

### Limitaciones del modelo de cálculo

**Racionalización APM** — fórmula conservadora por diseño:
`apmRationalizationSavings = apmCost × 0.3 × midpoint(coverageImprovement) × 2`
El reemplazo no elimina el 100% del costo inmediatamente. La regla `tco_cost_advantage_uncaptured` avisa cuando el diferencial no se ve reflejado en el ROI.

**TCO actual** — solo suma costos de bloques activos. Si APM block está inactivo pero tiene costo ingresado, ese dato no entra al cálculo (`apm_data_block_inactive` avisa sobre esto).

**Coexistencia** — el doble costo impacta el TCO del año 1 pero no el ROI base (que usa costo anual de Instana como denominador fijo).

**Confianza** — con nivel `low`, todos los valores son estimados del sector. El resultado es referencial, no un compromiso financiero.

---

## Estado actual: v0.4.0 — Fuente única de verdad (ReportModel)

---

## Cambios v0.4.0 — ReportModel integrado

### `src/engine/reportModel.ts`
- [x] `buildReportModel(state, results): ReportModel` — única invocación de `interpretROI` y `validateScenario`
- [x] Tipos exportados: `FormattedScenario`, `FormattedScore`, `ValueSource`, `SensitiveVar`, `ReadingSection`, `InputRow`, `AssumptionRow`, `ReportModel`
- [x] `buildReadingSection`: narrativa, fuentes de valor, variables sensibles, recomendaciones
- [x] `buildInputRows`: 34 filas con labels traducidos

### Integración en consumers
- [x] `App.tsx`: llama `buildReportModel`, pasa `model` a Dashboard
- [x] `Dashboard.tsx`: acepta `{ model: ReportModel }`, usa `model.scores`, `model.activeRoiTypeLabels`
- [x] `ResultReading.tsx`: acepta `{ model: ReportModel }`, usa `model.reading.*`
- [x] `ExportButtons.tsx`: acepta `{ model: ReportModel }`, pasa model a pdf y excel
- [x] `pdf.ts`: acepta `ReportModel`, scores en español, textos desde model
- [x] `excel.ts`: acepta `ReportModel`, scores en español, textos desde model

### `src/components/Debug/DebugPanel.tsx`
- [x] Dev-only (`import.meta.env.DEV || localStorage 'instana_roi_debug'`)
- [x] Muestra escenarios, scores, interpretación, validación, tipos de ROI, costos
- [x] Botón "Copiar ReportModel como JSON"

### `src/vite-env.d.ts`
- [x] `/// <reference types="vite/client" />` para `import.meta.env.DEV`

---

## Estado actual: v0.2.1 — QA integral + tests unitarios

---

## Cambios v0.2.1 — QA y corrección de cálculos

### Bugs corregidos (`src/engine/calculator.ts`)
- [x] **BUG-001**: `calcScores()` — `costPressure`, `apmUtilization`, `coverageRestriction` ahora son 0 cuando `commercial_apm` no está activo; `telemetryWaste` = 0 sin bloque `governance`; `fragmentation` = 0 sin bloque `fragmentation`; `adoptionReadiness` = 50 (neutro) sin bloque OSS
- [x] **BUG-002**: `calcScenarioResult()` — `telemetrySavings` ya no usa fallback `?? 500` para infra OSS; ahora requiere bloque OSS activo + costo real + volumen alto para generar ahorro
- [x] **BUG-003**: `App.tsx loadDemo()` ahora llama `clearState()` antes de cargar el estado demo

### Módulo de validación (`src/engine/validator.ts`)
- [x] Función `validateScenario(state, results) → ValidationResult`
- [x] 8 reglas: 1 error crítico (sin costo Instana), 5 warnings, 2 info
- [x] `canCalculateROI: false` solo cuando hay errores (no warnings)

### Tipos (`src/types/index.ts`)
- [x] `ValidationSeverity`, `ValidationIssue`, `ValidationResult` añadidos

### UI (`src/components/Dashboard/ValidationPanel.tsx`)
- [x] Panel colapsable con issues de validación
- [x] Integrado en Dashboard.tsx antes del panel de interpretación ROI
- [x] Color de banner diferenciado: rojo (errores) / amarillo (warnings) / azul (info)

### Tests unitarios (`src/engine/__tests__/calculator.test.ts`)
- [x] Vitest 2.1.8 instalado (devDependency)
- [x] `vitest.config.ts` separado (sin conflicto de versiones con Vite 6)
- [x] 47 tests en 10 suites: 8 fixtures de escenario + 2 suites de regresión de bugs
- [x] `npm test` → 47 passed ✓

### Documentación (`QA_RESULTADOS.md`)
- [x] Descripción de bugs encontrados y corregidos
- [x] Validación de consistencia UI / Motor / Exportables
- [x] Descripción de todas las reglas del validador
- [x] Estado del build y pendientes

### Build
- [x] `npm run build` → 0 errores TypeScript ✓

---

## Estado actual: v0.2.0 — Interpretación consultiva de ROI

---

## Cambios v0.2.0 — Interpretación de ROI negativo

### Motor de interpretación (`src/engine/interpreter.ts`)
- [x] Función `interpretROI(state, results)` → `ROIInterpretation` completo
- [x] 5 estados de ROI: `positive` | `negative_valid` | `negative_transition` | `negative_insufficient_data` | `requires_review`
- [x] 13 drivers de impacto con severidad (critical/high/medium/low) y categoría (cost/benefit/data/transition/context)
- [x] Detección de: falta de costo Instana, falta de costo APM, bajo volumen de incidentes, doble costo de migración, horizonte corto, adopción inicial sin baseline, criticidad baja, Instana más caro que APM actual, datos insuficientes, pocos bloques activos
- [x] Generación dinámica de: titular ejecutivo, contexto narrativo, resumen ejecutivo, sugerencias de validación, acciones de mejora
- [x] Textos diferenciados por contexto (adopción vs. reemplazo vs. migración vs. bajo impacto)

### Componente UI (`src/components/Dashboard/ROIInterpretation.tsx`)
- [x] Panel con banner de estado coloreado según tipo (verde/amarillo/naranja/gris/rojo)
- [x] Gráfico de barras mini por escenario (conservador/esperado/optimista) con indicadores +/−
- [x] Secciones colapsables: factores, datos a validar, acciones de mejora
- [x] Cada driver muestra label, descripción, badge de severidad y valor referencial
- [x] Nota de uso responsable al pie

### Dashboard actualizado (`Dashboard.tsx`)
- [x] Badge de estado ROI en el header del dashboard
- [x] Color del valor ROI: verde positivo / rojo negativo / gris insuficiente
- [x] Color del beneficio neto: verde/rojo según signo
- [x] Color del payback: naranja cuando supera 36 meses
- [x] Comparativa de escenarios con fondo rojo suave para negativos y badge ROI−
- [x] Panel ROIInterpretation insertado inmediatamente después del header

### Exportables actualizados
- [x] **Excel**: nueva hoja "Interpretación ROI" (hoja 7) con estado, headline, contexto, narrativa, drivers, validaciones y acciones
- [x] **PDF**: nueva sección con banner coloreado por estado, comparativa de escenarios, tabla de drivers con colores de severidad, validaciones numeradas, acciones en cajas azules

---

## Qué se construyó (v0.1.0)

### Estructura base
- [x] Proyecto Vite + React 18 + TypeScript configurado manualmente
- [x] Sistema de tipos completo (`src/types/index.ts`)
- [x] Estilos globales IBM Carbon/Instana (`src/styles/main.css`)
- [x] persistencia en localStorage con deep merge de defaults

### Motor de cálculo (`src/engine/calculator.ts`)
- [x] Cálculo de métricas de war rooms (horas hombre, costo mensual/anual)
- [x] Estimación de costo actual anual (TCO actual)
- [x] Cálculo de costo total Instana (licencia + servicios pro-rateados)
- [x] Tres escenarios: conservador, esperado, optimista
- [x] Desglose de ahorros por categoría (war rooms, admin, infra, APM, cobertura, fragmentación, telemetría)
- [x] ROI porcentual y payback en meses
- [x] TCO comparativo a 12/24/36 meses
- [x] 10 scores de contexto (0-100)
- [x] Detección automática de tipos de ROI aplicables
- [x] Nivel de confianza basado en datos reales vs. estimados

### Wizard de captura (6 pasos)
- [x] Paso 1: Perfil (cliente, industria, moneda, horizonte, punto de partida, driver)
- [x] Paso 2: Alcance (apps, criticidad, horario, contexto de negocio)
- [x] Paso 3: Incidentes y war rooms (frecuencia, tiempos, costo hora con estimado por industria)
- [x] Paso 4: Bloques opcionales con selección múltiple
- [x] Paso 5: Costos de Instana con slider de período de adopción
- [x] Paso 6: Dashboard ROI completo

### Bloques opcionales (8 bloques)
- [x] APM comercial actual (Dynatrace, NR, Datadog, AppDynamics, Elastic)
- [x] Open source / OSS (Prometheus, Grafana, ELK, Jaeger, Loki, Tempo, etc.)
- [x] OpenTelemetry (adopción, collector, lock-in)
- [x] Gobierno de telemetría (volumen, cardinalidad, sampling)
- [x] Fragmentación de herramientas (tools/incidente, vista única, correlación)
- [x] Migración / coexistencia (complejidad, dependencias, integraciones)
- [x] SLO/SLA y experiencia (SLO definidos, SLA contractual, RUM, synthetic)
- [x] Seguridad / compliance (data residency, on-prem)

### Dashboard ROI
- [x] Tarjetas métricas (ROI, payback, beneficio anual, war rooms)
- [x] Comparativa de 3 escenarios con selector
- [x] Gráfico TCO actual vs. Instana (BarChart Recharts)
- [x] Gráfico desglose de ahorros por categoría (BarChart horizontal)
- [x] Gráfico war rooms antes/después por escenario
- [x] 10 score bars con colores de estado
- [x] Tipos de ROI identificados como badges
- [x] Indicador de confianza con porcentaje de datos reales
- [x] Tabla de supuestos editables por escenario

### Exportables
- [x] Excel (.xlsx): 7 hojas con datos estructurados
- [x] PDF: portada IBM-style + resumen ejecutivo + perfil + resultados + scores + recomendación + notas

### Datos demo
- [x] `DEMO_STATE` precargado con "Banco Ejemplo S.A." con datos realistas de banca crítica

### Layout
- [x] Sidebar fijo con stepper + bloques activos como subnav
- [x] Header con título de paso, nombre del cliente, indicador de confianza
- [x] Botones Cargar demo y Limpiar en el header
- [x] Navegación Anterior/Siguiente con pie de página
- [x] Responsive básico (grid se colapsa en pantallas pequeñas)

---

## Qué falta / roadmap sugerido

### Prioridad alta
- [x] Editor de supuestos en tiempo real desde el dashboard — **completado en v0.4.2/0.4.3**
- [ ] Validación de campos obligatorios con indicadores visuales
- [x] Tooltips explicativos en scores y campos clave — **completado en v0.4.4**
- [x] Vista de recomendación consultiva narrativa (párrafo generado dinámicamente) — **completado en v0.4.0/0.4.1**

### Prioridad media
- [ ] Modo comparativo: múltiples escenarios guardados
- [ ] Exportar PDF con gráficos embebidos (html2canvas + jsPDF)
- [ ] Modo "cliente no sabe nada" con 100% supuestos automáticos
- [ ] Configuración de supuestos por industria (presets distintos)
- [ ] Página de bienvenida / onboarding
- [ ] Multi-idioma (español/inglés)

### Prioridad baja
- [ ] GitHub Pages deployment workflow
- [ ] Modo oscuro
- [ ] Historial de simulaciones (múltiples clientes)
- [ ] Compartir link (URL con estado comprimido)
- [ ] Integration con CRM/Salesforce para preventa

---

## Decisiones de diseño

1. **React + Vite + TS sin backend**: Toda la lógica es cliente. Sin dependencias de red. Funciona offline.

2. **localStorage para persistencia**: Simple, sin dependencias. Deep-merge con defaults para compatibilidad futura.

3. **Motor de cálculo puro**: `calculator.ts` recibe state, retorna results. Testeable y sin side effects.

4. **Sin precios hardcodeados**: Todos los costos de Instana son ingresados por el usuario. No se publican listas de precios.

5. **Supuestos editables**: Los porcentajes de escenarios están en el state y son visibles en el dashboard, reforzando la naturaleza simulada del resultado.

6. **Confianza como métrica activa**: El sistema penaliza el uso de valores estimados vs. datos reales y lo muestra explícitamente.

7. **IBM Carbon como referencia visual**: Colores, tipografía (IBM Plex Sans), espaciado y componentes siguiendo Carbon Design System, sin usar la librería para evitar dependencias pesadas.

---

## Limitaciones conocidas

- El PDF no incluye gráficos embebidos (requeriría html2canvas que añade peso y complejidad)
- Los scores son heurísticos basados en respuestas cualitativas, no métricas medidas
- El motor de cálculo usa el punto medio de los rangos de escenario (no simulación Monte Carlo)
- La detección de tipos de ROI es automática pero puede requerir ajuste manual en casos edge
- El costo de fragmentación es una estimación proporcional a war rooms, no un cálculo independiente
- Algunas fórmulas de cobertura recuperada son simplificadas (apps × criticidad × costo × factor)
