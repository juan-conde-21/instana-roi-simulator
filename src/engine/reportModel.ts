/**
 * buildReportModel — fuente única de verdad para UI, PDF y Excel.
 *
 * interpretROI y validateScenario se invocan UNA sola vez aquí.
 * Todas las etiquetas, formatos y textos narrativos se construyen aquí.
 * Los exportadores (pdf.ts, excel.ts) reciben el ReportModel y no re-calculan nada.
 */
import type { SimulationState, CalculationResults, ROIInterpretation, ValidationResult, ScenarioType, Scores, InstanaCostBreakdown } from '../types';
import { interpretROI } from './interpreter';
import { validateScenario } from './validator';
import { calculateInstanaCostBreakdown } from './instanaPricing';
import { DEFAULT_SCENARIOS_CONFIG } from '../data/defaults';
import { formatCurrency, formatPercent, formatMonths } from '../utils/format';
import {
  INDUSTRY_LABELS, STARTING_POINT_LABELS, EVAL_DRIVER_LABELS,
  CRITICALITY_LABELS, APP_COUNT_LABELS, APP_TYPE_LABELS, OPERATION_HOURS_LABELS,
  INCIDENT_FREQUENCY_LABELS, WAR_ROOM_DURATION_LABELS, WAR_ROOM_PEOPLE_LABELS,
  APM_TOOL_LABELS, COEXISTENCE_PERIOD_LABELS, HORIZON_LABELS, ROI_TYPE_LABELS,
  CONFIDENCE_LABELS, CONFIDENCE_SHORT, SCORE_LABELS, scoreInterpretation, label,
  DETECTION_TIME_LABELS, RESOLUTION_TIME_LABELS, COVERAGE_PERCENTAGE_LABELS, COST_CONCERN_LABELS,
} from '../utils/labels';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface FormattedScenario {
  key: ScenarioType;
  label: string;
  roi: number;
  roiFormatted: string;
  isPositive: boolean;
  paybackMonths: number;
  paybackFormatted: string;
  totalAnnualBenefit: number;
  totalAnnualBenefitFormatted: string;
  totalAnnualCostInstana: number;
  totalAnnualCostInstanaFormatted: string;
  netAnnualBenefit: number;
  netAnnualBenefitFormatted: string;
  // Desglose de ahorros
  warRoomSavingsFormatted: string;
  adminSavingsFormatted: string;
  infraSavingsFormatted: string;
  apmRationalizationSavingsFormatted: string;
  coverageValueFormatted: string;
  fragmentationSavingsFormatted: string;
  telemetrySavingsFormatted: string;
  // TCO
  tco12Formatted: string;
  tco24Formatted: string;
  tco36Formatted: string;
  tcoCurrentYear1Formatted: string;
  tcoCurrentYear1And2Formatted: string;
  tcoCurrentYear1To3Formatted: string;
}

export interface FormattedScore {
  key: string;
  label: string;
  value: number;
  valueRounded: number;
  interpretation: string;
}

export interface ValueSource {
  label: string;
  value: number;
  valueFormatted: string;
  pct: number;
}

export interface SensitiveVar {
  label: string;
  value: string;
  note: string;
}

export interface ReadingSection {
  narrativeParagraph: string;
  isNegative: boolean;
  isAllNegative: boolean;
  explanation: string;
  valueSources: ValueSource[];
  sensitiveVars: SensitiveVar[];
  recommendations: string[];
}

export interface InputRow {
  section: string;
  field: string;
  value: string;
}

export interface AssumptionRow {
  label: string;
  conservative: string;
  expected: string;
  optimistic: string;
}

export interface ReportModel {
  // Datos crudos — para gráficos en UI y debug
  state: SimulationState;
  results: CalculationResults;

  // Resultados pre-computados (únicos)
  interpretation: ROIInterpretation;
  validation: ValidationResult;

  // Identidad
  clientName: string;
  industryLabel: string;
  currencyCode: string;
  horizonLabel: string;
  startingPointLabel: string;
  evalDriverLabel: string;
  criticalityLabel: string;
  appCountLabel: string;
  appTypeLabel: string;
  operationHoursLabel: string;
  date: string;

  // Confianza
  confidenceLevelKey: string;
  confidenceLevelShort: string;
  confidenceFullLabel: string;
  dataCompleteness: number;

  // War room
  warRoomMonthlyManHours: number;
  warRoomMonthlyCostFormatted: string;
  warRoomAnnualCostFormatted: string;
  warRoomHourlyCostFormatted: string;
  warRoomHourlyCostNote: string;

  // Costos resumen
  currentAnnualCostFormatted: string;
  instanaAnnualCostFormatted: string;
  instanaCostModel: InstanaCostBreakdown;
  instanaCostRows: InputRow[];

  // Escenarios (los tres, pre-formateados)
  scenarios: {
    conservative: FormattedScenario;
    expected: FormattedScenario;
    optimistic: FormattedScenario;
  };

  // Scores
  scores: FormattedScore[];

  // Tipos de ROI activos (etiquetas legibles)
  activeRoiTypeLabels: string[];

  // Lectura del resultado
  reading: ReadingSection;

  // Supuestos (tabla)
  assumptionRows: AssumptionRow[];
  assumptionsCustomized: boolean;

  // Inputs (para hoja "Datos de entrada")
  inputRows: InputRow[];
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function fmtScenario(
  key: ScenarioType,
  scLabel: string,
  sr: CalculationResults['scenarios'][ScenarioType],
  fmt: (v: number) => string,
): FormattedScenario {
  return {
    key,
    label: scLabel,
    roi: sr.roi,
    roiFormatted: formatPercent(sr.roi, 1),
    isPositive: sr.roi >= 0,
    paybackMonths: sr.paybackMonths,
    paybackFormatted: formatMonths(sr.paybackMonths),
    totalAnnualBenefit: sr.totalAnnualBenefit,
    totalAnnualBenefitFormatted: fmt(sr.totalAnnualBenefit),
    totalAnnualCostInstana: sr.totalAnnualCostInstana,
    totalAnnualCostInstanaFormatted: fmt(sr.totalAnnualCostInstana),
    netAnnualBenefit: sr.netAnnualBenefit,
    netAnnualBenefitFormatted: fmt(sr.netAnnualBenefit),
    warRoomSavingsFormatted: fmt(sr.warRoomSavings),
    adminSavingsFormatted: fmt(sr.adminSavings),
    infraSavingsFormatted: fmt(sr.infraSavings),
    apmRationalizationSavingsFormatted: fmt(sr.apmRationalizationSavings),
    coverageValueFormatted: fmt(sr.coverageValue),
    fragmentationSavingsFormatted: fmt(sr.fragmentationSavings),
    telemetrySavingsFormatted: fmt(sr.telemetrySavings),
    tco12Formatted: fmt(sr.tco12),
    tco24Formatted: fmt(sr.tco24),
    tco36Formatted: fmt(sr.tco36),
    tcoCurrentYear1Formatted: fmt(sr.tcoCurrentYear1),
    tcoCurrentYear1And2Formatted: fmt(sr.tcoCurrentYear1 + sr.tcoCurrentYear2),
    tcoCurrentYear1To3Formatted: fmt(sr.tcoCurrentYear1 + sr.tcoCurrentYear2 + sr.tcoCurrentYear3),
  };
}

function buildScores(scores: Scores): FormattedScore[] {
  return Object.entries(SCORE_LABELS).map(([key, lbl]) => ({
    key,
    label: lbl,
    value: scores[key as keyof Scores],
    valueRounded: Math.round(scores[key as keyof Scores]),
    interpretation: scoreInterpretation(key, scores[key as keyof Scores]),
  }));
}

function buildValueSources(sr: CalculationResults['scenarios']['expected'], fmt: (v: number) => string): ValueSource[] {
  const raw = [
    { label: 'War rooms', value: sr.warRoomSavings },
    { label: 'Administración', value: sr.adminSavings },
    { label: 'Infraestructura', value: sr.infraSavings },
    { label: 'Racionalización APM', value: sr.apmRationalizationSavings },
    { label: 'Cobertura recuperada', value: sr.coverageValue },
    { label: 'Fragmentación', value: sr.fragmentationSavings },
    { label: 'Gobierno de telemetría', value: sr.telemetrySavings },
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value);
  const total = raw.reduce((sum, s) => sum + s.value, 0);
  return raw.map(s => ({
    label: s.label,
    value: s.value,
    valueFormatted: fmt(s.value),
    pct: total > 0 ? (s.value / total) * 100 : 0,
  }));
}

function buildSensitiveVars(state: SimulationState, results: CalculationResults, fmt: (v: number) => string): SensitiveVar[] {
  const hasAPM = state.blocks.activeBlocks.includes('commercial_apm') || state.profile.startingPoint === 'commercial_apm';
  const hasMig = state.blocks.activeBlocks.includes('migration');
  const sr = results.scenarios.expected;

  const vars: SensitiveVar[] = [
    {
      label: 'Frecuencia de incidentes',
      value: label(INCIDENT_FREQUENCY_LABELS, state.incidents.incidentFrequency),
      note: 'Multiplica directamente el costo de war rooms',
    },
    {
      label: 'Duración promedio war room',
      value: label(WAR_ROOM_DURATION_LABELS, state.incidents.warRoomDuration),
      note: 'Afecta las horas hombre totales en incidentes',
    },
    {
      label: 'Personas en war room',
      value: label(WAR_ROOM_PEOPLE_LABELS, state.incidents.warRoomPeople),
      note: 'Factor de escala en el costo de incidentes',
    },
    {
      label: 'Costo hora equipo',
      value: state.incidents.useEstimatedHourlyCost
        ? `${fmt(results.warRoom.hourlyTeamCostUsed)}/h (estimado por industria)`
        : `${fmt(results.warRoom.hourlyTeamCostUsed)}/h (dato real ingresado)`,
      note: 'Base del cálculo de todos los ahorros en tiempo de personas',
    },
  ];

  if (hasAPM && state.apmBlock.annualCost) {
    vars.push({
      label: 'Costo APM actual',
      value: `${fmt(state.apmBlock.annualCost)}/año`,
      note: 'Referencia para calcular ahorro de racionalización',
    });
  }

  vars.push({
    label: 'Costo anual Instana',
    value: results.instanaAnnualCost > 0
      ? `${fmt(results.instanaAnnualCost)}/año`
      : 'No ingresado — cálculo bloqueado',
    note: 'Denominador del ROI: a mayor costo, mayor beneficio requerido',
  });

  if (hasMig) {
    vars.push({
      label: 'Período de coexistencia',
      value: label(COEXISTENCE_PERIOD_LABELS, state.migrationBlock.coexistencePeriod),
      note: 'Doble costo durante transición impacta TCO del primer año',
    });
  }

  vars.push(
    {
      label: 'Horizonte de evaluación',
      value: `${state.profile.horizon} meses`,
      note: 'Un horizonte corto comprime el payback y puede mostrar ROI negativo',
    },
    {
      label: 'Mejora esperada en war rooms',
      value: `${state.scenariosConfig.expected.warRoomReduction[0]}–${state.scenariosConfig.expected.warRoomReduction[1]}%`,
      note: `Supuesto de reducción → ahorro estimado: ${fmt(sr.warRoomSavings)}/año`,
    },
  );

  return vars;
}

function buildRecommendations(state: SimulationState, results: CalculationResults): string[] {
  const recs: string[] = [];
  const sr = results.scenarios.expected;
  const hasAPM = state.blocks.activeBlocks.includes('commercial_apm') || state.profile.startingPoint === 'commercial_apm';
  const isNeg = sr.roi < 0;
  const isAllNeg = results.scenarios.conservative.roi < 0 && sr.roi < 0 && results.scenarios.optimistic.roi < 0;

  if (results.confidenceLevel !== 'high') {
    recs.push(
      `Completar los datos de impacto operativo (frecuencia de incidentes, duración de war rooms, costo hora equipo) para elevar el nivel de confianza del análisis. Actualmente está en nivel ${CONFIDENCE_SHORT[results.confidenceLevel] ?? results.confidenceLevel} con ${Math.round(results.dataCompleteness)}% de datos reales.`
    );
  }

  if (hasAPM && !state.apmBlock.annualCost) {
    recs.push('Ingresar el costo anual del APM actual. Sin este dato no es posible calcular el ahorro de racionalización ni comparar el TCO con Instana de forma significativa.');
  }

  if (isNeg && state.profile.horizon === 12) {
    recs.push('Ampliar el horizonte de evaluación a 24 o 36 meses. Los beneficios de observabilidad — reducción de incidentes, eficiencia administrativa, cobertura ampliada — se consolidan a mediano plazo y no siempre son visibles en un análisis a 12 meses.');
  }

  if (isNeg && sr.totalAnnualBenefit < results.instanaAnnualCost * 0.5) {
    recs.push('El beneficio estimado cubre menos del 50% del costo de Instana. Validar con el equipo de operaciones si la frecuencia y duración real de incidentes coincide con lo ingresado — este suele ser el dato con mayor impacto en el modelo.');
  }

  if (state.blocks.activeBlocks.includes('migration') && state.migrationBlock.hasDoubleCost === 'yes') {
    recs.push('Confirmar con el cliente la estrategia de coexistencia. Un período largo con doble licencia impacta el TCO del primer año. Explorar si un "fast-switch" técnico puede acortar esta etapa.');
  }

  if (results.scores.apmUtilization < 30 && hasAPM) {
    recs.push('El APM actual parece estar subutilizado. Antes de presentar el reemplazo como prioridad, explorar si una mejora de adopción interna puede cubrir las necesidades a corto plazo.');
  }

  if (isAllNeg && results.confidenceLevel === 'low') {
    recs.push('No forzar el caso financiero si el ROI directo es bajo con datos incompletos. Evaluar el valor desde cobertura de riesgo operativo, cumplimiento regulatorio o mejora de experiencia del cliente — dimensiones que pueden ser más persuasivas en este contexto.');
  }

  recs.push('Evaluar una fase piloto con 2 a 3 aplicaciones de alta criticidad. Un piloto genera datos reales de impacto (MTTR antes/después, frecuencia de incidentes) que pueden reemplazar los supuestos actuales y fortalecer el análisis financiero.');

  return recs.slice(0, 6);
}

function buildReadingSection(state: SimulationState, results: CalculationResults, fmt: (v: number) => string): ReadingSection {
  const sr = results.scenarios.expected;
  const isNegative = sr.roi < 0;
  const isAllNegative = results.scenarios.conservative.roi < 0 && sr.roi < 0 && results.scenarios.optimistic.roi < 0;

  const narrativeParagraph = [
    `Bajo los supuestos ingresados, el escenario esperado muestra un ROI estimado de ${formatPercent(sr.roi, 0)}.`,
    `El beneficio anual estimado es de ${fmt(sr.totalAnnualBenefit)}, frente a un costo anual de Instana de ${fmt(results.instanaAnnualCost)}.`,
    sr.paybackMonths < 999
      ? `El payback estimado es de ${formatMonths(sr.paybackMonths)}.`
      : `La inversión no se recupera dentro del horizonte de ${state.profile.horizon} meses evaluado.`,
    `Nivel de confianza: ${CONFIDENCE_SHORT[results.confidenceLevel] ?? results.confidenceLevel} (${Math.round(results.dataCompleteness)}% datos reales ingresados).`,
  ].join(' ');

  const startingPoint = state.profile.startingPoint;
  const hasCoexistence = state.blocks.activeBlocks.includes('migration') && state.migrationBlock.hasDoubleCost === 'yes';

  let explanation: string;
  if (isNegative) {
    if (startingPoint === 'no_apm' || startingPoint === 'basic_monitoring') {
      explanation = `El ROI es negativo en este escenario de adopción inicial. Al no existir un APM previo, no hay costo de herramienta que reemplazar, por lo que el análisis financiero depende exclusivamente de los ahorros operativos (reducción de incidentes, eficiencia administrativa). Esto es válido y esperado: el valor de una primera adopción de observabilidad suele materializarse en el mediano plazo y puede ser difícil de cuantificar con datos estimados. Considerar un horizonte de 24 o 36 meses y completar los datos de impacto operativo para elevar la confianza del análisis.`;
    } else if (startingPoint === 'commercial_apm') {
      explanation = `El ROI es negativo en este escenario de reemplazo de APM comercial. El modelo captura solo una fracción conservadora del ahorro por racionalización de licencias (no el 100% del costo actual del APM), porque en la práctica el reemplazo no elimina todos los costos de forma inmediata. Si el costo del APM actual es significativamente mayor al de Instana, activar el bloque APM con el costo real puede mejorar el resultado. También revisar si el período de coexistencia está impactando el TCO del primer año.`;
    } else if (startingPoint === 'open_source') {
      explanation = `El ROI es negativo en este escenario de transición desde open source. El TCO de una solución OSS incluye infraestructura, administración y mantenimiento, pero el modelo solo captura una parte de ese costo diferencial. Completar los datos del bloque OSS (costo de infraestructura mensual, personas en administración, horas de mantenimiento) es fundamental para que el análisis refleje el costo real de la alternativa actual.`;
    } else if (hasCoexistence) {
      explanation = `El ROI es negativo, en parte por el doble costo durante el período de coexistencia. Mientras Instana y el APM anterior conviven, el cliente absorbe dos costos de licencia simultáneamente. Esto impacta el TCO del primer año y puede hacer que el ROI parezca negativo a corto plazo. A partir del momento en que se complete la migración, el análisis mejora. Evaluar si un "fast-switch" técnico puede acortar el período de coexistencia.`;
    } else {
      explanation = `El ROI es negativo porque el beneficio anual estimado (${fmt(sr.totalAnnualBenefit)}) no supera el costo anual considerado de Instana (${fmt(results.instanaAnnualCost)}) dentro del horizonte de ${state.profile.horizon} meses seleccionado. Esto puede reflejar un horizonte corto, supuestos conservadores o datos de impacto operativo incompletos. Un ROI negativo en esta herramienta no equivale a que la inversión sea incorrecta. Se recomienda validar frecuencia de incidentes, costo hora equipo, impacto de negocio, costo actual de herramientas y horizonte de evaluación.`;
    }
  } else {
    explanation = `El ROI es positivo porque los beneficios estimados (${fmt(sr.totalAnnualBenefit)}) superan el costo anual considerado de Instana (${fmt(results.instanaAnnualCost)}). El retorno proviene principalmente de las categorías con mayor contribución al beneficio total. Los resultados dependen de la exactitud de los datos ingresados y los supuestos de mejora aplicados.`;
  }

  return {
    narrativeParagraph,
    isNegative,
    isAllNegative,
    explanation,
    valueSources: buildValueSources(sr, fmt),
    sensitiveVars: buildSensitiveVars(state, results, fmt),
    recommendations: buildRecommendations(state, results),
  };
}

function buildAssumptionRows(state: SimulationState): AssumptionRow[] {
  const { conservative: c, expected: e, optimistic: o } = state.scenariosConfig;
  const pct = (r: [number, number]) => `${r[0]}–${r[1]}%`;
  return [
    { label: 'Reducción MTTR', conservative: pct(c.mttrReduction), expected: pct(e.mttrReduction), optimistic: pct(o.mttrReduction) },
    { label: 'Reducción MTTD', conservative: pct(c.mttdReduction), expected: pct(e.mttdReduction), optimistic: pct(o.mttdReduction) },
    { label: 'Reducción war rooms', conservative: pct(c.warRoomReduction), expected: pct(e.warRoomReduction), optimistic: pct(o.warRoomReduction) },
    { label: 'Reducción administración', conservative: pct(c.adminReduction), expected: pct(e.adminReduction), optimistic: pct(o.adminReduction) },
    { label: 'Mejora cobertura', conservative: pct(c.coverageImprovement), expected: pct(e.coverageImprovement), optimistic: pct(o.coverageImprovement) },
    { label: 'Reducción fragmentación', conservative: pct(c.fragmentationReduction), expected: pct(e.fragmentationReduction), optimistic: pct(o.fragmentationReduction) },
  ];
}


function deploymentLabel(value: string): string {
  return value === 'self_hosted' ? 'Self-Hosted / On-Premise' : 'SaaS';
}

function costModeLabel(value: string): string {
  return value === 'detailed' ? 'Calculado referencial' : 'Manual';
}

function syntheticLocationLabel(value: string): string {
  if (value === 'customer_private_pop') return 'Customer Private PoP';
  if (value === 'self_hosted') return 'Self-Hosted';
  return 'IBM Hosted Public PoP';
}

function fmtNumber(value: number | null | undefined, suffix = ''): string {
  const n = Math.max(0, Number(value) || 0);
  return `${n}${suffix}`;
}

function buildInstanaCostRows(state: SimulationState, model: InstanaCostBreakdown, fmt: (v: number) => string): InputRow[] {
  const costs = state.instanaCosts;
  const rows: InputRow[] = [
    { section: 'Costo Instana', field: 'Modo', value: costModeLabel(model.mode) },
    { section: 'Costo Instana', field: 'Meses', value: `${model.months}` },
  ];

  if (model.mode === 'manual') {
    rows.push(
      { section: 'Costo Instana', field: 'Fuente del costo', value: 'Ingresado manualmente' },
      { section: 'Costo Instana', field: 'Costo anual manual', value: fmt(costs.annualLicenseCost ?? 0) },
      { section: 'Costo Instana', field: 'Costo adicional de logs manual', value: fmt(costs.logsCost ?? 0) },
      { section: 'Costo Instana', field: 'Costo synthetic manual', value: fmt(costs.syntheticCost ?? 0) },
      { section: 'Costo Instana', field: 'Otros componentes manuales', value: fmt(costs.additionalComponentsCost ?? 0) },
      { section: 'Costo Instana', field: 'Implementacion', value: fmt(model.implementationCost) },
      { section: 'Costo Instana', field: 'Capacitacion', value: fmt(model.trainingCost) },
      { section: 'Costo Instana', field: 'Servicios profesionales', value: fmt(model.professionalServicesCost) },
      { section: 'Costo Instana', field: 'Operacion interna', value: fmt(model.operationCost) },
      { section: 'Costo Instana', field: 'Total mensual estimado', value: fmt(model.totalMonthly) },
      { section: 'Costo Instana', field: 'Total anual estimado', value: fmt(model.totalAnnual) },
      { section: 'Costo Instana', field: 'Total horizonte', value: fmt(model.totalHorizon) },
    );
  } else {
    rows.push(
      { section: 'Costo Instana', field: 'Fuente del costo', value: 'Calculado desde variables referenciales' },
      { section: 'Costo Instana', field: 'Deployment', value: deploymentLabel(model.deploymentModel) },
      { section: 'Costo Instana', field: 'Standard / APM MVS', value: fmtNumber(costs.standardMvsQty, ' MVS') },
      { section: 'Costo Instana', field: 'Standard / APM precio mensual unitario', value: fmt(costs.standardMonthlyUnitPrice ?? 0) },
      { section: 'Costo Instana', field: 'Standard / APM meses', value: fmtNumber(costs.standardMonths ?? model.months) },
      { section: 'Costo Instana', field: 'Base Standard / APM', value: fmt(model.standardCost) },
      { section: 'Costo Instana', field: 'Essentials / IQM MVS', value: fmtNumber(costs.essentialsMvsQty, ' MVS') },
      { section: 'Costo Instana', field: 'Essentials / IQM precio mensual unitario', value: fmt(costs.essentialsMonthlyUnitPrice ?? 0) },
      { section: 'Costo Instana', field: 'Essentials / IQM meses', value: fmtNumber(costs.essentialsMonths ?? model.months) },
      { section: 'Costo Instana', field: 'Base Essentials / IQM', value: fmt(model.essentialsCost) },
      { section: 'Costo Instana', field: 'Base total antes de descuento', value: fmt(model.baseCost) },
      { section: 'Costo Instana', field: 'Descuento porcentual', value: `${Math.max(0, costs.discountPercent ?? 0)}%` },
      { section: 'Costo Instana', field: 'Motivo del descuento', value: costs.discountReason || 'No indicado' },
      { section: 'Costo Instana', field: 'Descuento aplicado', value: fmt(model.discountAmount) },
      { section: 'Costo Instana', field: 'Base con descuento', value: fmt(model.discountedBaseCost) },
      { section: 'Costo Instana', field: 'Data Ingest activo', value: costs.includeDataIngestAddon ? 'Si' : 'No' },
      { section: 'Costo Instana', field: 'Data Ingest esperado mensual', value: fmtNumber(costs.expectedMonthlyDataIngestGb, ' GB') },
      { section: 'Costo Instana', field: 'Fair use incluido', value: fmtNumber(model.includedFairUseGb, ' GB') },
      { section: 'Costo Instana', field: 'Data Ingest add-on comprado', value: fmtNumber(costs.dataIngestAddonGb, ' GB') },
      { section: 'Costo Instana', field: 'Data Ingest overage mensual', value: fmtNumber(model.monthlyDataIngestOverageGb, ' GB') },
      { section: 'Costo Instana', field: 'Data Ingest costo add-on mensual', value: fmt(model.dataIngestAddonMonthlyCost) },
      { section: 'Costo Instana', field: 'Data Ingest costo overage mensual', value: fmt(model.dataIngestOverageMonthlyCost) },
      { section: 'Costo Instana', field: 'Data Ingest costo total', value: fmt(model.dataIngestCost) },
      { section: 'Costo Instana', field: 'Logs in Context activo', value: costs.includeLogsAddon ? 'Si' : 'No' },
      { section: 'Costo Instana', field: 'Logs aplicabilidad', value: model.deploymentModel === 'self_hosted' ? 'Self-Hosted: validar licencia, sizing e infraestructura' : 'SaaS: calculado por volumen y retencion' },
      { section: 'Costo Instana', field: 'Logs retencion', value: `${costs.logsRetentionDays} dias` },
      { section: 'Costo Instana', field: 'Logs GB mensuales', value: fmtNumber(costs.logsMonthlyGb, ' GB') },
      { section: 'Costo Instana', field: 'Logs tamano unidad', value: fmtNumber(costs.logsUnitSizeGb, ' GB') },
      { section: 'Costo Instana', field: 'Logs unidades calculadas', value: fmtNumber(model.logsUnits) },
      { section: 'Costo Instana', field: 'Logs overage GB', value: fmtNumber(costs.logsOverageGb, ' GB') },
      { section: 'Costo Instana', field: 'Logs overage unidades', value: fmtNumber(model.logsOverageUnits) },
      { section: 'Costo Instana', field: 'Logs costo mensual', value: fmt(model.logsMonthlyCost) },
      { section: 'Costo Instana', field: 'Logs overage costo mensual', value: fmt(model.logsOverageCost) },
      { section: 'Costo Instana', field: 'Logs costo total', value: fmt(model.logsCost) },
      { section: 'Costo Instana', field: 'Synthetic activo', value: costs.includeSynthetic ? 'Si' : 'No' },
      { section: 'Costo Instana', field: 'Synthetic execution location', value: syntheticLocationLabel(costs.syntheticExecutionLocation) },
      { section: 'Costo Instana', field: 'Simple API tests / ejecuciones', value: `${fmtNumber(costs.simpleApiTests)} tests x ${fmtNumber(costs.simpleApiExecutionsPerMonth)} ejecuciones/mes` },
      { section: 'Costo Instana', field: 'Simple API RU mensual', value: fmtNumber(model.simpleApiRuMonthly, ' RU') },
      { section: 'Costo Instana', field: 'API script tests / ejecuciones', value: `${fmtNumber(costs.apiScriptTests)} tests x ${fmtNumber(costs.apiScriptExecutionsPerMonth)} ejecuciones/mes` },
      { section: 'Costo Instana', field: 'API script RU mensual', value: fmtNumber(model.apiScriptRuMonthly, ' RU') },
      { section: 'Costo Instana', field: 'Browser tests / ejecuciones', value: `${fmtNumber(costs.browserTests)} tests x ${fmtNumber(costs.browserExecutionsPerMonth)} ejecuciones/mes` },
      { section: 'Costo Instana', field: 'Browser RU mensual', value: fmtNumber(model.browserRuMonthly, ' RU') },
      { section: 'Costo Instana', field: 'Synthetic RU mensual total', value: fmtNumber(model.syntheticRuMonthly, ' RU') },
      { section: 'Costo Instana', field: 'Synthetic unidades RU compradas', value: fmtNumber(model.syntheticPurchasedRuUnits) },
      { section: 'Costo Instana', field: 'Synthetic costo mensual', value: fmt(model.syntheticMonthlyCost) },
      { section: 'Costo Instana', field: 'Synthetic costo total', value: fmt(model.syntheticCost) },
      { section: 'Costo Instana', field: 'Implementacion', value: fmt(model.implementationCost) },
      { section: 'Costo Instana', field: 'Capacitacion', value: fmt(model.trainingCost) },
      { section: 'Costo Instana', field: 'Servicios profesionales', value: fmt(model.professionalServicesCost) },
      { section: 'Costo Instana', field: 'Operacion interna', value: fmt(model.operationCost) },
      { section: 'Costo Instana', field: 'Coexistencia / transicion', value: fmt(model.coexistenceTransitionCost) },
      { section: 'Costo Instana', field: 'Total mensual estimado', value: fmt(model.totalMonthly) },
      { section: 'Costo Instana', field: 'Total anual estimado', value: fmt(model.totalAnnual) },
      { section: 'Costo Instana', field: 'Total horizonte', value: fmt(model.totalHorizon) },
    );
  }

  rows.push(
    ...model.warnings.map(w => ({ section: 'Costo Instana', field: 'Advertencia', value: w })),
    ...model.assumptions.map(a => ({ section: 'Costo Instana', field: 'Supuesto', value: a })),
  );

  return rows;
}

function buildInputRows(state: SimulationState, results: CalculationResults, fmt: (v: number) => string): InputRow[] {
  const yn: Record<string, string> = { yes: 'Sí', no: 'No', unknown: 'No definido', partial: 'Parcialmente' };
  const rows: InputRow[] = [
    { section: 'Perfil', field: 'Cliente', value: state.profile.clientName || 'Sin nombre' },
    { section: 'Perfil', field: 'Industria', value: label(INDUSTRY_LABELS, state.profile.industry) },
    { section: 'Perfil', field: 'Moneda', value: state.profile.currency },
    { section: 'Perfil', field: 'Horizonte de evaluación', value: label(HORIZON_LABELS, String(state.profile.horizon), `${state.profile.horizon} meses`) },
    { section: 'Perfil', field: 'Punto de partida', value: label(STARTING_POINT_LABELS, state.profile.startingPoint) },
    { section: 'Perfil', field: 'Driver de evaluación', value: label(EVAL_DRIVER_LABELS, state.profile.evalDriver) },
    { section: 'Alcance', field: 'Cantidad de aplicaciones', value: label(APP_COUNT_LABELS, state.scope.appCount) },
    { section: 'Alcance', field: 'Tipo de aplicaciones', value: label(APP_TYPE_LABELS, state.scope.appType) },
    { section: 'Alcance', field: 'Criticidad', value: label(CRITICALITY_LABELS, state.scope.criticality) },
    { section: 'Alcance', field: 'Horario de operación', value: label(OPERATION_HOURS_LABELS, state.scope.operationHours) },
    { section: 'Alcance', field: 'Afecta clientes externos', value: yn[state.scope.affectsExternalClients] ?? state.scope.affectsExternalClients },
    { section: 'Alcance', field: 'Procesa transacciones económicas', value: yn[state.scope.processesEconomicTransactions] ?? state.scope.processesEconomicTransactions },
    { section: 'Alcance', field: 'Tiene SLA o requerimiento regulatorio', value: yn[state.scope.hasSlAorRegulatory] ?? state.scope.hasSlAorRegulatory },
    { section: 'Incidentes', field: 'Frecuencia de incidentes', value: label(INCIDENT_FREQUENCY_LABELS, state.incidents.incidentFrequency) },
    { section: 'Incidentes', field: 'Tiempo de detección', value: label(DETECTION_TIME_LABELS, state.incidents.detectionTime) },
    { section: 'Incidentes', field: 'Tiempo de resolución', value: label(RESOLUTION_TIME_LABELS, state.incidents.resolutionTime) },
    { section: 'Incidentes', field: 'Duración promedio war room', value: label(WAR_ROOM_DURATION_LABELS, state.incidents.warRoomDuration) },
    { section: 'Incidentes', field: 'Personas en war room', value: label(WAR_ROOM_PEOPLE_LABELS, state.incidents.warRoomPeople) },
    {
      section: 'Incidentes',
      field: 'Costo hora equipo',
      value: state.incidents.useEstimatedHourlyCost
        ? `${fmt(results.warRoom.hourlyTeamCostUsed)}/h (estimado por industria)`
        : `${fmt(results.warRoom.hourlyTeamCostUsed)}/h (dato real)`,
    },
    { section: 'APM Block', field: 'Bloque APM activo', value: state.blocks.activeBlocks.includes('commercial_apm') ? 'Sí' : 'No' },
    { section: 'APM Block', field: 'Herramienta APM actual', value: label(APM_TOOL_LABELS, state.apmBlock.tool) },
    { section: 'APM Block', field: 'Costo anual APM actual', value: state.apmBlock.annualCost != null ? fmt(state.apmBlock.annualCost) : 'No ingresado' },
    { section: 'APM Block', field: 'Costo renovación proyectado', value: state.apmBlock.projectedRenewalCost != null ? fmt(state.apmBlock.projectedRenewalCost) : 'No ingresado' },
    { section: 'APM Block', field: 'Cobertura de aplicaciones críticas', value: label(COVERAGE_PERCENTAGE_LABELS, state.apmBlock.criticalAppsCoverage) },
    { section: 'APM Block', field: 'Preocupación por costo APM', value: label(COST_CONCERN_LABELS, state.apmBlock.costConcern) },
    { section: 'OSS Block', field: 'Bloque open source activo', value: state.blocks.activeBlocks.includes('open_source') ? 'Sí' : 'No' },
    { section: 'OSS Block', field: 'Costo infraestructura mensual', value: state.openSourceBlock.monthlyInfraCost != null ? fmt(state.openSourceBlock.monthlyInfraCost) : 'No ingresado' },
    { section: 'OSS Block', field: 'Personas en administración', value: state.openSourceBlock.adminPeople != null ? String(state.openSourceBlock.adminPeople) : 'No ingresado' },
    { section: 'OSS Block', field: 'Horas de mantenimiento/mes', value: state.openSourceBlock.maintenanceHoursMonthly != null ? String(state.openSourceBlock.maintenanceHoursMonthly) : 'No ingresado' },
    { section: 'Migración', field: 'Bloque migración activo', value: state.blocks.activeBlocks.includes('migration') ? 'Sí' : 'No' },
    { section: 'Migración', field: 'Período de coexistencia', value: label(COEXISTENCE_PERIOD_LABELS, state.migrationBlock.coexistencePeriod) },
    { section: 'Migración', field: 'Doble costo durante coexistencia', value: yn[state.migrationBlock.hasDoubleCost] ?? state.migrationBlock.hasDoubleCost },
    { section: 'Instana', field: 'Modo de costo', value: costModeLabel(state.instanaCosts.costMode ?? 'manual') },
    { section: 'Instana', field: 'Licencia anual manual', value: state.instanaCosts.annualLicenseCost != null ? fmt(state.instanaCosts.annualLicenseCost) : 'No ingresado' },
    { section: 'Instana', field: 'Costo de implementación', value: state.instanaCosts.implementationCost != null ? fmt(state.instanaCosts.implementationCost) : 'No ingresado' },
    { section: 'Instana', field: 'Capacitación', value: state.instanaCosts.trainingCost != null ? fmt(state.instanaCosts.trainingCost) : 'No ingresado' },
    { section: 'Instana', field: 'Servicios profesionales', value: state.instanaCosts.professionalServicesCost != null ? fmt(state.instanaCosts.professionalServicesCost) : 'No ingresado' },
    { section: 'Instana', field: 'Operación interna anual', value: state.instanaCosts.internalOperationCost != null ? fmt(state.instanaCosts.internalOperationCost) : 'No ingresado' },
    { section: 'Instana', field: 'Costo anual total (calculado)', value: fmt(results.instanaAnnualCost) },
  ];
  return rows;
}

// ─── Función principal ────────────────────────────────────────────────────────

export function buildReportModel(state: SimulationState, results: CalculationResults): ReportModel {
  const fmt = (v: number) => formatCurrency(v, state.profile.currency, state.profile.customCurrency);

  // Única llamada a interpretROI y validateScenario
  const interpretation = interpretROI(state, results);
  const validation = validateScenario(state, results);
  const instanaCostModel = calculateInstanaCostBreakdown(state.instanaCosts, state.profile.horizon);
  const instanaCostRows = buildInstanaCostRows(state, instanaCostModel, fmt);

  const SCENARIO_LABELS: Record<ScenarioType, string> = {
    conservative: 'Conservador',
    expected: 'Esperado',
    optimistic: 'Optimista',
  };

  const sr = results.scenarios;
  const warRoomHourlyCostNote = state.incidents.useEstimatedHourlyCost ? 'estimado por industria' : 'dato real';

  return {
    // Datos crudos
    state,
    results,

    // Pre-computados únicos
    interpretation,
    validation,

    // Identidad
    clientName: state.profile.clientName || 'Sin nombre',
    industryLabel: label(INDUSTRY_LABELS, state.profile.industry),
    currencyCode: state.profile.currency,
    horizonLabel: label(HORIZON_LABELS, String(state.profile.horizon), `${state.profile.horizon} meses`),
    startingPointLabel: label(STARTING_POINT_LABELS, state.profile.startingPoint),
    evalDriverLabel: label(EVAL_DRIVER_LABELS, state.profile.evalDriver),
    criticalityLabel: label(CRITICALITY_LABELS, state.scope.criticality),
    appCountLabel: label(APP_COUNT_LABELS, state.scope.appCount),
    appTypeLabel: label(APP_TYPE_LABELS, state.scope.appType),
    operationHoursLabel: label(OPERATION_HOURS_LABELS, state.scope.operationHours),
    date: new Date().toLocaleDateString('es-PE'),

    // Confianza
    confidenceLevelKey: results.confidenceLevel,
    confidenceLevelShort: CONFIDENCE_SHORT[results.confidenceLevel] ?? results.confidenceLevel,
    confidenceFullLabel: CONFIDENCE_LABELS[results.confidenceLevel] ?? results.confidenceLevel,
    dataCompleteness: results.dataCompleteness,

    // War room
    warRoomMonthlyManHours: results.warRoom.monthlyManHours,
    warRoomMonthlyCostFormatted: fmt(results.warRoom.monthlyCost),
    warRoomAnnualCostFormatted: fmt(results.warRoom.annualCost),
    warRoomHourlyCostFormatted: fmt(results.warRoom.hourlyTeamCostUsed),
    warRoomHourlyCostNote,

    // Costos resumen
    currentAnnualCostFormatted: fmt(results.currentAnnualCost),
    instanaAnnualCostFormatted: fmt(results.instanaAnnualCost),
    instanaCostModel,
    instanaCostRows,

    // Escenarios
    scenarios: {
      conservative: fmtScenario('conservative', SCENARIO_LABELS.conservative, sr.conservative, fmt),
      expected: fmtScenario('expected', SCENARIO_LABELS.expected, sr.expected, fmt),
      optimistic: fmtScenario('optimistic', SCENARIO_LABELS.optimistic, sr.optimistic, fmt),
    },

    // Scores
    scores: buildScores(results.scores),

    // Tipos de ROI
    activeRoiTypeLabels: Object.entries(results.roiTypes)
      .filter(([, v]) => v)
      .map(([k]) => label(ROI_TYPE_LABELS, k, k)),

    // Lectura del resultado
    reading: buildReadingSection(state, results, fmt),

    // Supuestos
    assumptionRows: buildAssumptionRows(state),
    assumptionsCustomized: JSON.stringify(state.scenariosConfig) !== JSON.stringify(DEFAULT_SCENARIOS_CONFIG),

    // Inputs
    inputRows: [...buildInputRows(state, results, fmt), ...instanaCostRows],
  };
}
