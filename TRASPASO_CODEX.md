# Traspaso a Codex — Simulador ROI IBM Instana

**Versión en traspaso:** v0.4.6  
**Fecha:** 2026-06-30  
**Estado:** Release candidate local · sin deploy a GitHub Pages aún  
**Tests:** 183/183 pasando · Build: limpio · 0 errores TypeScript

---

## A. Estado actual del proyecto

### Stack
- **Frontend**: React 18 + TypeScript 5.7 + Vite 6
- **Charts**: Recharts 2.13 (dashboard UI)
- **PDF**: jsPDF 2.5 + jsPDF-autoTable 3.8 (gráficos vectoriales programáticos)
- **Excel**: xlsx 0.18
- **CSS**: IBM Carbon design tokens (manual, sin la librería oficial)
- **Tests**: Vitest 2.1 (183 tests, entorno Node)
- **Sin backend**: todo el cálculo es local, sin APIs

### Cómo ejecutar

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo → http://localhost:5173
npm test             # ejecutar suite completa (183 tests)
npm run build        # build de producción (tsc + vite)
npm run preview      # vista previa del build
```

### Archivos raíz relevantes
```
.gitignore           # node_modules, dist, .env, pricing.private.*…
vite.config.ts       # base './', manualChunks para lazy loading
vitest.config.ts     # environment: node, include src/**/__tests__/**
package.json         # versión 0.2.0, scripts, dependencias
PROGRESO.md          # historial de versiones y decisiones técnicas
QA_RESULTADOS.md     # resultado de QA integral de v0.2.1 (bugs corregidos)
TRASPASO_CODEX.md    # este archivo
```

---

## B. Arquitectura

### Flujo de datos principal

```
SimulationState (localStorage)
    │
    ▼
calculate(state) → CalculationResults     [src/engine/calculator.ts]
    │
    ▼
buildReportModel(state, results)           [src/engine/reportModel.ts]
    │
    ├─→ Dashboard.tsx (Recharts, scores, ScenarioEditor)
    ├─→ exportToPDF(model)                [src/export/pdf.ts]
    └─→ exportToExcel(model)             [src/export/excel.ts]
```

### Componentes principales

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `App` | `src/App.tsx` | Estado global, routing por step, loadDemo/reset |
| `Step1Profile` … `Step5InstanaCosts` | `src/components/Wizard/` | Formularios del wizard |
| `Step4Blocks` | `src/components/Wizard/Step4Blocks.tsx` | Activación de bloques opcionales |
| `Dashboard` | `src/components/Dashboard/Dashboard.tsx` | Visualización de resultados, charts Recharts |
| `ScenarioEditor` | `src/components/Dashboard/ScenarioEditor.tsx` | Editor de supuestos en vivo |
| `ResultReading` | `src/components/Dashboard/ResultReading.tsx` | Narrativa de la lectura del resultado |
| `ROIInterpretationPanel` | `src/components/Dashboard/ROIInterpretation.tsx` | Panel de interpretación con drivers |
| `ValidationPanel` | `src/components/Dashboard/ValidationPanel.tsx` | Alertas de validación de datos |
| `ExportButtons` | `src/components/Export/ExportButtons.tsx` | Lazy loading de pdf.ts y excel.ts |
| `HelpTooltip` | `src/components/UI/HelpTooltip.tsx` | Tooltip contextual accesible |

### Motor de cálculo (`src/engine/`)

| Archivo | Función |
|---|---|
| `calculator.ts` | `calculate(state)` → `CalculationResults`: ROI, TCO, savings por categoría, scores (10), roiTypes |
| `interpreter.ts` | `interpretROI(state, results)` → `ROIInterpretation`: status, badge, headline, drivers, narrativa |
| `validator.ts` | `validateScenario(state, results)` → `ValidationResult`: issues con severidad |
| `reportModel.ts` | `buildReportModel(state, results)` → `ReportModel`: fuente única de verdad para PDF/Excel/UI |

### ReportModel — contrato de datos

`ReportModel` es el objeto central que alimenta tanto el dashboard como los exportables. Contiene:
- Todos los valores ya **formateados** (con moneda, porcentaje, meses)
- **Etiquetas en español** (sin enums internos)
- `scenarios.conservative/expected/optimistic` — `FormattedScenario`
- `scores[]` — `FormattedScore[]` con label e interpretation en español
- `reading` — `ReadingSection`: narrativa, fuentes de valor, variables sensibles, recomendaciones
- `inputRows[]` — datos de entrada en tabla
- `assumptionRows[]` — supuestos por escenario
- `assumptionsCustomized` — boolean para badge de "personalizados"
- `interpretation` — `ROIInterpretation` completo
- `validation` — `ValidationResult` completo

Los exportadores **nunca re-calculan**. Consumen exclusivamente el ReportModel.

### Exportadores

**PDF** (`src/export/pdf.ts` + `src/export/pdfCharts.ts`):
- `exportToPDF(model)`: 12 secciones, ~15 páginas
- Gráficos con `drawROIChart`, `drawTCOChart`, `drawSavingsChart`, `drawScoreChart` — todas en `pdfCharts.ts`
- `safeChart(fn)`: wrapper try/catch — el PDF siempre se genera aunque un gráfico falle
- Cargado via `dynamic import()` en ExportButtons — no está en el bundle inicial

**Excel** (`src/export/excel.ts`):
- `exportToExcel(model)`: 8 hojas (Resumen, Datos, Supuestos, Cálculos, Escenarios, Scores, Interpretación ROI, Recomendación)
- Cargado via `dynamic import()` en ExportButtons

### Sistema de validaciones

`validateScenario()` produce `ValidationIssue[]` con severidad `error | warning | info`.
El `ValidationPanel` muestra estos issues en el dashboard.
Los exportables incluyen la validación en el ReportModel.

### Editor de supuestos en vivo

`ScenarioEditor` permite modificar los 6 parámetros de cada escenario (conservador/esperado/optimista) en rangos `[min, max]`.
Cada cambio dispara `onScenariosChange(cfg)` → `setState` → re-render del Dashboard.
`model.assumptionsCustomized` compara con `DEFAULT_SCENARIOS_CONFIG` para mostrar el badge.

### Sistema de tooltips

`helpTexts.ts` — diccionario `as const` con 8 secciones (~60 entradas):
`profile`, `scope`, `incidents`, `blocks`, `instanaCosts`, `dashboard`, `scores`, `scenarioEditor`

`HelpTooltip` — componente accesible con:
- `aria-expanded`, `aria-controls`, `role="tooltip"`
- Click (mobile), hover (desktop), focus (teclado)
- Auto-flip si está cerca del borde superior
- Cierre con Escape y click fuera

### Mapeo de enums a etiquetas

**Regla crítica**: nunca mostrar valores internos de enum en la UI, PDF o Excel.
`src/utils/labels.ts` centraliza todos los mapeos:
`INDUSTRY_LABELS`, `STARTING_POINT_LABELS`, `EVAL_DRIVER_LABELS`, `APM_TOOL_LABELS`, etc.

La función `label(map, key, fallback?)` retorna la etiqueta o el fallback (nunca el enum crudo).

---

## C. Decisiones técnicas importantes

### Punto de partida principal = selección única
El campo `startingPoint` en Step1Profile usa un `ToggleGroup` exclusivo.
Define el contexto base del análisis: `no_apm`, `basic_monitoring`, `commercial_apm`, `open_source`, `multiple_tools`, `unknown`.
Los bloques opcionales del Step4 son *adicionales* y no reemplazan este campo.

### Bloques opcionales = combinables
`blocks.activeBlocks: OptionalBlock[]` es un array.
El cliente puede tener simultáneamente: APM comercial + fragmentación + migración + OTel.
Cada bloque activo contribuye componentes de ahorro adicionales al cálculo.

### ROI negativo ≠ error automático
El motor de interpretación clasifica el ROI negativo en 4 categorías: `negative_valid`, `negative_transition`, `negative_insufficient_data`, `requires_review`.
Solo `requires_review` implica datos inconsistentes.
Los demás son escenarios legítimos con explicación contextual en español.
**Nunca forzar ni suavizar un resultado negativo.**

### PDF/Excel consumen el ReportModel, nunca re-calculan
Todos los valores ya están formateados y en español en el ReportModel.
Los exportadores son "dumb renderers": reciben el modelo y lo convierten a bytes.
Esto garantiza consistencia UI ↔ PDF ↔ Excel.

### Sin enums internos en superficie pública
Regla fija: cualquier valor de tipo `StartingPoint`, `EvalDriver`, `APMTool`, etc. que aparezca en UI, PDF o Excel debe pasar por `label(MAP, key)`.
Verificado en v0.4.6 (4 bugs de este tipo corregidos).

### Sin promesas de ahorro
Todos los porcentajes de mejora son "supuestos del sector" con disclaimer explícito.
El PDF y Excel incluyen el aviso en portada, en la sección de supuestos y en notas finales.
Nunca usar verbos como "garantiza", "logra", "reducirá".

### Datos en localStorage, sin backend
El estado completo se serializa en `localStorage` en cada cambio.
`loadState()` / `saveState()` / `clearState()` en `src/utils/storage.ts`.
"Cargar demo" y "Limpiar" reemplazan el estado completo.

---

## D. Pendientes sugeridos para Codex

### Próximo foco: Módulo de pricing de Instana (v0.5.x)

**Objetivo**: calcular un costo referencial de Instana a partir de parámetros técnicos del cliente, para que el consultor no tenga que ingresar el precio manualmente como caja negra.

**Parámetros a implementar**:
| Parámetro | Descripción |
|---|---|
| MVS (Monitored Virtual Servers) | Número de servidores/hosts a monitorear |
| Agentes por host | Promedio de agentes Instana por servidor |
| Deployment model | SaaS (IBM Cloud) vs. on-premises (self-hosted) |
| Edición | Standard, Advanced, Premium (si aplica) |
| Add-ons | Synthetic, Logs, RUM, Infrastructure only |
| Meses de contrato | 12, 24 o 36 (alineado con `horizon`) |

**Diseño sugerido**:
- Nuevo step opcional o sección en Step5InstanaCosts
- Los valores referenciales deben estar en un archivo de configuración **editable** (ej. `src/data/pricingConfig.ts`), nunca hardcodeados en componentes UI
- El precio calculado pre-rellena `annualLicenseCost` en `instanaCosts` (el usuario puede sobreescribir)
- Mostrar desglose: base + add-ons + descuento por horizonte (si aplica)
- Agregar nota visible: "Precio referencial — no vinculante. Solicitar cotización oficial."

**Advertencias para pricing**:
- Consultar con el equipo de ventas o pricing team antes de publicar rangos
- No usar precios de contratos reales como valores por defecto
- Centralizar en un archivo que sea fácil de actualizar cuando cambien los precios
- El archivo de configuración de precios puede ser excluido del repo público si contiene información sensible (ver `.gitignore`)

### Otros pendientes sugeridos (no bloqueantes)

| Pendiente | Prioridad | Notas |
|---|---|---|
| GitHub Pages deploy | Alta | Configurar `base` en vite.config.ts, workflow CI/CD |
| Lazy loading de Recharts | Media | Requiere refactor del Dashboard (Suspense boundary) |
| Tests E2E básicos (Playwright) | Media | Al menos golden path: demo → dashboard → export |
| Eliminar html2canvas si no se usa | Baja | Está en bundle lazy, no afecta performance |
| Internacionalización (i18n) | Baja | App actualmente solo en español |
| Modo offline / PWA | Baja | Ya funciona sin backend; agregar manifest + SW |

---

## E. Advertencias importantes para el agente siguiente

### Seguridad y confidencialidad

1. **No subir archivos internos de pricing al repo público.**
   Cualquier precio, descuento o estructura tarifaria interna debe estar en archivos excluidos por `.gitignore` (`pricing.private.json`, `pricing.local.json`).

2. **No hardcodear precios en componentes UI.**
   Si se implementa pricing, los valores deben vivir en `src/data/pricingConfig.ts` (o similar), con un comentario explícito de que son referenciales y deben actualizarse.

3. **No usar logos oficiales de IBM o Instana** a menos que se tenga licencia explícita para uso en herramientas de preventa. El repo actual no incluye logos.

4. **No implementar z/OS, mainframe, MSU, VU ni Instana on z/OS.**
   Esta herramienta es exclusivamente para **distributed observability** (servidores Linux/Windows, contenedores, Kubernetes). El pricing de z/OS es completamente diferente y fuera del alcance.

5. **No hacer push a main sin revisar** si el repo es público. Confirmar con el equipo la estrategia de branching y visibilidad antes del primer deploy.

### Calidad de código

6. **Nunca mostrar enums en la UI, PDF o Excel.**
   Usar siempre `label(MAP, key)` de `src/utils/labels.ts`. Los 4 bugs de enum leakage corregidos en v0.4.6 son un buen ejemplo de lo que no debe ocurrir.

7. **Nunca re-calcular en los exportadores.**
   PDF y Excel consumen el ReportModel. Si hay una nueva fuente de ahorro o un nuevo campo de resultado, primero se agrega al `calculator.ts` y al `reportModel.ts`, luego los exportadores lo consumen automáticamente.

8. **ROI negativo es un resultado válido**, no un bug. No añadir lógica que lo suavice, corrija o ignore.

9. **Agregar tests antes de agregar funcionalidades importantes.**
   La suite actual cubre el motor de cálculo y el ReportModel. Un nuevo módulo de pricing debe tener tests unitarios antes de integrarse al wizard.

### Operativos

10. **`QA_RESULTADOS.md` en raíz es legado** de una sesión de QA anterior (v0.2.1). No editar ni eliminar sin revisarlo primero — documenta 4 bugs críticos corregidos y su impacto.

11. **`PROGRESO.md`** es el historial completo de versiones. Mantenerlo actualizado como fuente de verdad del estado del proyecto.

---

## F. Resumen de archivos clave

| Archivo | Descripción |
|---|---|
| `src/types/index.ts` | Todos los tipos TypeScript del dominio |
| `src/data/defaults.ts` | `DEFAULT_STATE`, `DEFAULT_SCENARIOS_CONFIG` |
| `src/data/demo.ts` | `DEMO_STATE` (datos de ejemplo para "Cargar demo") |
| `src/engine/calculator.ts` | Motor de cálculo principal |
| `src/engine/reportModel.ts` | Fuente única de verdad para exportables |
| `src/utils/labels.ts` | Mapeo enum → etiqueta en español |
| `src/content/helpTexts.ts` | Textos de ayuda para tooltips (~60 entradas) |
| `src/export/pdf.ts` | Exportador PDF |
| `src/export/pdfCharts.ts` | Gráficos jsPDF para PDF |
| `src/export/excel.ts` | Exportador Excel |
| `src/styles/main.css` | Estilos IBM Carbon + componentes propios |
| `vite.config.ts` | Config Vite con manualChunks (lazy loading) |
| `.gitignore` | Excluye node_modules, dist, .env, pricing.private.* |
| `PROGRESO.md` | Historial completo de versiones y decisiones |
| `QA_RESULTADOS.md` | Resultado de QA integral v0.2.1 |
