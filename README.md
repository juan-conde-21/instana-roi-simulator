# Simulador ROI – IBM Instana

Herramienta consultiva de preventa para estimar el retorno de inversión de IBM Instana en proyectos de observabilidad.

> ⚠️ **Aviso importante**: Esta herramienta es una simulación consultiva. Los resultados son estimaciones basadas en supuestos del sector y los datos ingresados. No representan garantías, compromisos ni precios oficiales de IBM o Instana.

## Objetivo

Simular el ROI de Instana considerando distintos puntos de partida del cliente: sin APM, monitoreo básico, APM comercial, open source o varias herramientas combinadas. Los resultados se presentan como estimaciones en tres escenarios (conservador, esperado, optimista) con nivel de confianza explícito.

## Instalación y ejecución local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# → Abre http://localhost:5173

# Ejecutar tests
npm test

# Build para producción
npm run build

# Vista previa del build
npm run preview
```


## Deploy en GitHub Pages

El proyecto esta preparado para publicarse en GitHub Pages mediante GitHub Actions.

- Workflow: `.github/workflows/deploy-pages.yml`
- Branch de despliegue: `main`
- Build publicado: `dist/`
- Base path Vite: `/instana-roi-simulator/`

URL esperada:

```text
https://TU_USUARIO.github.io/instana-roi-simulator/
```

Para desarrollo local se mantiene `npm run dev` con Vite. El `base` configurado afecta el build de produccion para GitHub Pages.

## Tests

```
10 archivos de test · 238 tests unitarios

src/engine/__tests__/
├── calculator.test.ts                    # 55 tests — motor de cálculo
├── assumptionsValidation.test.ts         # 15 tests — validaciones de supuestos
├── calculationWithCustomAssumptions.test.ts # 27 tests — supuestos personalizados
├── helpTextsValidation.test.ts           # 65 tests — contenido de tooltips
└── pdfExport.test.ts                     # 21 tests — modelo de exportación
```

Los tests cubren el motor de cálculo, pricing Instana, validaciones, supuestos personalizados, textos de ayuda y el contrato de datos del ReportModel hacia PDF/Excel.
No incluyen tests de primitivas de dibujo jsPDF (requieren JSDOM + canvas, no configurado).

## Estructura del proyecto

```
src/
├── types/          # Tipos TypeScript globales (SimulationState, CalculationResults…)
├── data/           # Valores por defecto (defaults.ts) y demo (demo.ts)
├── engine/         # Motor de cálculo
│   ├── calculator.ts       # Cálculo de ROI, TCO, scores
│   ├── interpreter.ts      # Interpretación del resultado (ROIInterpretation)
│   ├── reportModel.ts      # ReportModel — fuente única de verdad para exportables
│   ├── validator.ts        # Validación de escenario
│   └── __tests__/          # Suite de tests unitarios
├── export/         # Exportadores
│   ├── pdf.ts              # Exportador PDF (jsPDF + jsPDF-autoTable)
│   ├── pdfCharts.ts        # Gráficos vectoriales para PDF
│   └── excel.ts            # Exportador Excel (xlsx)
├── content/
│   └── helpTexts.ts        # Textos de ayuda para tooltips (centralizados)
├── utils/
│   ├── format.ts           # formatCurrency, formatPercent, formatMonths
│   ├── labels.ts           # Mapeo enum → etiqueta legible
│   └── storage.ts          # localStorage (saveState, loadState, clearState)
├── styles/
│   └── main.css            # CSS global (IBM Carbon / Instana design tokens)
└── components/
    ├── Layout/     # Sidebar, Header
    ├── Wizard/     # Step1Profile … Step5InstanaCosts
    ├── Blocks/     # 8 bloques opcionales
    ├── Dashboard/  # Dashboard, ScenarioEditor, ResultReading, ROIInterpretation, ValidationPanel
    ├── Export/     # ExportButtons (lazy loading)
    └── UI/         # FormField, HelpTooltip
```

## Flujo de la aplicación

1. **Perfil inicial** — Cliente, industria, moneda, horizonte, punto de partida
2. **Alcance** — Cantidad de apps, criticidad, horario de operación
3. **Incidentes y war rooms** — Frecuencia, duración, personas, costo hora
4. **Bloques opcionales** — APM comercial, Open source, OTel, Governance, Fragmentación, Migración, SLO/SLA, Seguridad
5. **Costos de Instana** — Licencia, implementación, capacitación, operación
6. **Dashboard ROI** — Resultados, gráficos Recharts, scores, editor de supuestos, exportables


## Estimador referencial de costo Instana

La seccion de costos incluye dos modos:

- **Ingresar costo manual**: conserva el modelo anterior. El usuario ingresa directamente el costo anual estimado de Instana.
- **Calcular costo referencial**: estima el costo desde variables editables de pricing: deployment, Standard/APM, Essentials/IQM, MVS/agentes, meses, add-ons, servicios y descuentos.

El modo detallado permite diferenciar SaaS y Self-Hosted / On-Premise, combinar lineas Standard/APM y Essentials/IQM, y modelar add-ons como Data Ingest / Fair Use, Logs in Context y Synthetic Monitoring / Managed PoP. Tambien incluye implementacion, capacitacion, servicios profesionales, operacion interna y coexistencia/transicion si aplica.

Todos los precios unitarios son editables desde la UI y se tratan como valores referenciales. El PDF y Excel indican que la estimacion no reemplaza una cotizacion oficial.

Alcance explicito: **Instana Distributed only**. No incluye mainframe, z/OS, MSU, VU, IBM Observability by Instana APM on z/OS, ShopZ ni Workload Pricer.

Ver detalle tecnico en [`docs/instana-pricing-model.md`](docs/instana-pricing-model.md).

## Exportables

- **Excel (.xlsx)**: 8 hojas — Resumen ejecutivo, Datos de entrada, Supuestos, Cálculos, Escenarios, Scores, Interpretación ROI, Recomendación
- **PDF ejecutivo**: Portada · resumen financiero · gráficos vectoriales ejecutivos · scores detallados · interpretación · recomendación · datos de entrada · notas metodológicas

Los exportadores usan **lazy loading**: jsPDF y xlsx no se descargan hasta que el usuario hace clic en "Exportar". Esto reduce el bundle inicial de 1411 KB a 163 KB.

### Gráficos PDF

Los gráficos del PDF se generan con primitivas jsPDF (no html2canvas). Son distintos visualmente a los charts Recharts del dashboard pero usan los mismos datos del ReportModel.

| Gráfico | Descripción |
|---|---|
| ROI por escenario | Barras bidireccionales con línea de cero |
| Comparativa TCO | Costo actual vs. Instana para años 1–3 |
| Desglose de ahorros | Por categoría, proporcional |
| Scores de adopción | Doble columna: contexto + adopción |

## Supuestos y editor de escenarios

Los porcentajes de mejora son supuestos del sector, editables desde el dashboard. Cada cambio actualiza el dashboard en tiempo real.

| Parámetro | Conservador | Esperado | Optimista |
|---|---|---|---|
| Reducción MTTR | 10–15% | 25–35% | 45–55% |
| Reducción MTTD | 15–20% | 30–40% | 50–60% |
| Reducción war rooms | 15–20% | 30–40% | 50–60% |
| Reducción administración | 5–10% | 15–25% | 35–40% |
| Mejora de cobertura | 10% | 25–30% | 40–50% |

Si el consultor modifica los supuestos, el PDF y Excel muestran un aviso visible de "supuestos personalizados".

## Interpretación de ROI negativo

Un ROI negativo **no es un error**. El simulador lo trata como un resultado válido con explicación contextual:

- **Adopción inicial (sin APM)**: el valor está en visibilidad y reducción de riesgo, no en reemplazo directo
- **Horizonte corto (12 meses)**: los beneficios de observabilidad se materializan a mediano plazo
- **Datos insuficientes**: la confianza es baja, el resultado puede cambiar con datos reales
- **Coexistencia**: el doble costo del primer año impacta el TCO inicial
- **Requiere revisión**: faltan datos clave (costo de Instana, APM actual)

El PDF y Excel incluyen siempre la explicación contextual del resultado, sin ocultar ni suavizar valores negativos.

## Persistencia de datos

Los datos se guardan automáticamente en `localStorage`. Para limpiar: botón "Limpiar" en el header (pide confirmación). "Cargar demo" reemplaza completamente el estado con datos de ejemplo.

## Restricciones importantes

- No incluye precios oficiales de Instana — ingresar cotización real del equipo de ventas
- No incluye logos oficiales de IBM/Instana
- Los resultados son estimaciones, no garantías comerciales
- No usa APIs externas — todo el cálculo es local
- No implementa z/OS, mainframe, MSU, VU ni Instana on z/OS
- El alcance de la herramienta es **distributed observability only**
