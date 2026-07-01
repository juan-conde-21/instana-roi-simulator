/**
 * Motor de interpretación de ROI.
 *
 * Recibe el estado completo y los resultados del cálculo y produce una
 * interpretación consultiva estructurada del resultado financiero.
 * No modifica supuestos ni fuerza resultados positivos.
 */

import type {
  SimulationState,
  CalculationResults,
  ROIInterpretation,
  ROIStatus,
  ROIDriver,
  ROIDriverSeverity,
  ROIScenarioComparison,
} from '../types';
import { formatCurrency, formatPercent } from '../utils/format';
import { APM_TOOL_LABELS, STARTING_POINT_LABELS, label } from '../utils/labels';

// ─── Helpers internos ─────────────────────────────────────────────────────────

function fmt(v: number, state: SimulationState) {
  return formatCurrency(v, state.profile.currency, state.profile.customCurrency);
}

function driver(
  id: string,
  label: string,
  description: string,
  severity: ROIDriverSeverity,
  category: ROIDriver['category'],
  value?: string,
): ROIDriver {
  return { id, label, description, severity, category, value };
}

// ─── Detección de drivers ──────────────────────────────────────────────────────

function detectDrivers(state: SimulationState, results: CalculationResults): ROIDriver[] {
  const drivers: ROIDriver[] = [];
  const { profile, incidents, instanaCosts, apmBlock, openSourceBlock, migrationBlock, blocks } = state;
  const exp = results.scenarios.expected;
  const hasAPMBlock = blocks.activeBlocks.includes('commercial_apm') || profile.startingPoint === 'commercial_apm';
  const hasOSSBlock = blocks.activeBlocks.includes('open_source') || profile.startingPoint === 'open_source';
  const hasMigrationBlock = blocks.activeBlocks.includes('migration');

  // ── Falta costo de Instana ─────────────────────────────────────────────────
  const instanaAnnualCost = results.instanaAnnualCost;
  const instanaLicenseMissing = instanaAnnualCost === 0;
  const instanaAllMissing = instanaAnnualCost === 0;

  if (instanaAllMissing) {
    drivers.push(driver(
      'no_instana_cost',
      'Sin costo de Instana cargado',
      'El costo anual de Instana no fue ingresado. Sin este dato el cálculo de ROI no puede ser confiable: el denominador de la fórmula es cero o artificialmente bajo.',
      'critical',
      'data',
    ));
  } else if (instanaLicenseMissing) {
    drivers.push(driver(
      'instana_license_missing',
      'Licencia de Instana sin valor',
      'Solo se ingresaron costos secundarios (implementación, capacitación). La licencia anual es el componente principal del denominador del ROI.',
      'high',
      'data',
    ));
  }

  // ── APM block activo sin costo declarado ──────────────────────────────────
  if (hasAPMBlock && !apmBlock.annualCost && exp.roi < 0) {
    drivers.push(driver(
      'no_apm_cost',
      'Costo del APM actual sin declarar',
      `Se activó el bloque de APM comercial (${label(APM_TOOL_LABELS, apmBlock.tool, apmBlock.tool)}) pero no se cargó el costo anual actual. Este valor es clave para calcular el ahorro por racionalización o reemplazo. Sin él, uno de los mayores componentes de beneficio queda en cero.`,
      'high',
      'cost',
      'Campo: "Costo anual actual" en bloque APM comercial',
    ));
  }

  // ── Costo APM supera largamente a Instana sin beneficio suficiente ─────────
  if (hasAPMBlock && apmBlock.annualCost && instanaAnnualCost) {
    const savingRatio = (apmBlock.annualCost - instanaAnnualCost) / apmBlock.annualCost;
    if (savingRatio < 0.1 && exp.apmRationalizationSavings < exp.totalAnnualCostInstana * 0.3) {
      drivers.push(driver(
        'low_apm_delta',
        'Delta limitado entre APM actual e Instana',
        `El costo del APM actual (${fmt(apmBlock.annualCost, state)}) y el de Instana (${fmt(instanaAnnualCost, state)}) son similares. El ahorro por reemplazo directo es marginal. El caso de negocio debe sustentarse en beneficios operativos adicionales.`,
        'medium',
        'cost',
        `Diferencia: ${fmt(Math.abs(apmBlock.annualCost - instanaAnnualCost), state)}/año`,
      ));
    }
  }

  // ── Open source sin TCO declarado ─────────────────────────────────────────
  if (hasOSSBlock && !openSourceBlock.monthlyInfraCost && !openSourceBlock.maintenanceHoursMonthly && exp.roi < 0) {
    drivers.push(driver(
      'no_oss_tco',
      'TCO open source sin cuantificar',
      'Se activó el bloque open source pero no se ingresaron ni el costo mensual de infraestructura ni las horas de mantenimiento. El ahorro potencial por reducción de TCO queda en cero.',
      'medium',
      'cost',
      'Campos: "Costo mensual de infra" y "Horas de mantenimiento/mes"',
    ));
  }

  // ── Bajo volumen de incidentes ─────────────────────────────────────────────
  if (['0-1', '2-4'].includes(incidents.incidentFrequency)) {
    const warRoomAnnual = results.warRoom.annualCost;
    const pctOfBenefit = exp.totalAnnualBenefit > 0
      ? (exp.warRoomSavings / exp.totalAnnualBenefit) * 100 : 0;
    drivers.push(driver(
      'low_incidents',
      'Bajo volumen de incidentes declarado',
      `Con ${incidents.incidentFrequency} incidentes relevantes por mes, el ahorro estimado por reducción de war rooms es bajo (${fmt(warRoomAnnual, state)}/año, ${pctOfBenefit.toFixed(0)}% del beneficio total simulado). El caso de negocio en este contexto se sustenta mejor en cobertura, riesgo estratégico o estandarización que en ahorro directo.`,
      incidents.incidentFrequency === '0-1' ? 'high' : 'medium',
      'benefit',
      `War rooms anuales: ${fmt(warRoomAnnual, state)}`,
    ));
  }

  // ── Costos de Instana superan el beneficio calculado ─────────────────────
  if (results.instanaAnnualCost > 0 && exp.totalAnnualBenefit < results.instanaAnnualCost) {
    const gap = results.instanaAnnualCost - exp.totalAnnualBenefit;
    drivers.push(driver(
      'cost_exceeds_benefit',
      'Costo de Instana supera el beneficio estimado',
      `El costo anual total de Instana (${fmt(results.instanaAnnualCost, state)}) supera los beneficios simulados en el escenario esperado (${fmt(exp.totalAnnualBenefit, state)}). La brecha es de ${fmt(gap, state)}/año. Esto puede corregirse cargando más componentes de ahorro o reduciendo el scope de la solución.`,
      'high',
      'cost',
      `Brecha: ${fmt(gap, state)}/año`,
    ));
  }

  // ── Impacto de transición / coexistencia ─────────────────────────────────
  if (hasMigrationBlock && migrationBlock.hasDoubleCost === 'yes') {
    const implCost = (instanaCosts.implementationCost ?? 0) +
      (instanaCosts.trainingCost ?? 0) +
      (instanaCosts.professionalServicesCost ?? 0);
    const periodLabel: Record<string, string> = { '1m': '1 mes', '3m': '3 meses', '6m': '6 meses', '12m': '12 meses' };
    drivers.push(driver(
      'migration_double_cost',
      'Doble costo durante período de coexistencia',
      `Se declaró un período de coexistencia de ${periodLabel[migrationBlock.coexistencePeriod] ?? migrationBlock.coexistencePeriod} con doble licenciamiento. Esto incrementa los costos del primer año. Los escenarios a 24 y 36 meses pueden mostrar un ROI significativamente mejor una vez absorbido este costo de transición.`,
      'medium',
      'transition',
      `Inversión inicial: ${fmt(implCost, state)}`,
    ));
  }

  // ── Horizonte corto impactando payback ────────────────────────────────────
  if (profile.horizon === 12 && exp.paybackMonths > 12 && exp.roi < 0) {
    drivers.push(driver(
      'short_horizon',
      'Horizonte de 12 meses insuficiente para el payback',
      `El payback estimado en el escenario esperado supera los 12 meses. Con un horizonte de análisis de solo 12 meses, el ROI resulta negativo aunque la inversión sea rentable a mediano plazo. Se recomienda evaluar a 24 o 36 meses.`,
      'medium',
      'transition',
      `Payback esperado: ${exp.paybackMonths <= 999 ? `${exp.paybackMonths} meses` : 'No determinado'}`,
    ));
  }

  // ── Escenario de adopción inicial (sin APM previo) ────────────────────────
  if (['no_apm', 'basic_monitoring'].includes(profile.startingPoint)) {
    drivers.push(driver(
      'adoption_scenario',
      'Escenario de adopción inicial',
      `El punto de partida es "${profile.startingPoint === 'no_apm' ? 'Sin APM' : 'Monitoreo básico'}". En este caso, Instana representa una nueva inversión sin un gasto de referencia equivalente que sea posible eliminar. El ROI financiero directo puede ser moderado, pero el valor real se encuentra en la reducción de riesgo operativo, la visibilidad ganada y la capacidad de respuesta ante incidentes.`,
      'medium',
      'context',
    ));
  }

  // ── Pocos bloques activos → pocos componentes de ahorro ──────────────────
  if (blocks.activeBlocks.length === 0 && exp.roi < 0) {
    drivers.push(driver(
      'no_blocks_active',
      'Sin bloques opcionales activos',
      'No se activaron bloques de contexto adicionales (APM comercial, open source, fragmentación, etc.). Cada bloque contribuye componentes de ahorro al cálculo. Activar los bloques relevantes permite reflejar mejor la situación real del cliente y capturar más categorías de beneficio.',
      'medium',
      'data',
      'Bloques activos: 0',
    ));
  }

  // ── Criticidad baja reduce impacto ────────────────────────────────────────
  if (state.scope.criticality === 'low' && exp.roi < 0) {
    drivers.push(driver(
      'low_criticality',
      'Criticidad baja de las aplicaciones',
      'La criticidad declarada como "Baja" reduce los multiplicadores de impacto de incidentes en los cálculos. Aplicaciones de baja criticidad generan menor presión de costo por downtime. Si existe un subconjunto de apps críticas, el caso de negocio puede fortalecerse enfocando el análisis en ellas.',
      'low',
      'context',
    ));
  }

  // ── Datos insuficientes ───────────────────────────────────────────────────
  if (results.dataCompleteness < 40 && exp.roi < 0) {
    drivers.push(driver(
      'insufficient_data',
      'Alta proporción de datos estimados',
      `Solo el ${Math.round(results.dataCompleteness)}% de los campos clave tienen datos reales. La mayoría de los valores provienen de supuestos del simulador basados en industria y criticidad. La confianza actual es ${results.confidenceLevel}. Ingresar más datos reales puede cambiar significativamente el resultado.`,
      results.dataCompleteness < 25 ? 'high' : 'medium',
      'data',
      `Completitud: ${Math.round(results.dataCompleteness)}%`,
    ));
  }

  // ── Instana más caro que el APM actual en términos absolutos ──────────────
  if (hasAPMBlock && apmBlock.annualCost && instanaAnnualCost &&
      instanaAnnualCost > apmBlock.annualCost * 1.1) {
    drivers.push(driver(
      'instana_more_expensive',
      'Costo de Instana superior al APM actual',
      `El costo anual de Instana ingresado (${fmt(instanaAnnualCost, state)}) es mayor que el costo actual del APM (${fmt(apmBlock.annualCost, state)}). Si el objetivo es reducción de costos, este escenario no lo soporta directamente. El valor de Instana en este caso sería mayor cobertura, mejor operabilidad o estandarización, no ahorro de licencia.`,
      'high',
      'cost',
      `Diferencia: ${fmt(instanaAnnualCost - apmBlock.annualCost, state)}/año más caro`,
    ));
  }

  return drivers.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ─── Clasificación del estado ROI ─────────────────────────────────────────────

function classifyStatus(
  state: SimulationState,
  results: CalculationResults,
  comparison: ROIScenarioComparison,
  drivers: ROIDriver[],
): ROIStatus {
  const exp = results.scenarios.expected;

  // Siempre positivo
  if (exp.roi >= 0) return 'positive';

  // Inconsistencia estructural
  const hasCriticalData = drivers.some(d => d.id === 'no_instana_cost');
  const hasMissingAPMCost = drivers.some(d => d.id === 'no_apm_cost');
  const hasInstanaMoreExpensive = drivers.some(d => d.id === 'instana_more_expensive');
  if (hasCriticalData || (hasMissingAPMCost && !results.instanaAnnualCost)) {
    return 'requires_review';
  }
  if (hasInstanaMoreExpensive && results.dataCompleteness > 60) {
    return 'requires_review';
  }

  // Datos insuficientes
  if (results.dataCompleteness < 30 && results.confidenceLevel === 'low') {
    return 'negative_insufficient_data';
  }

  // Impactado principalmente por transición
  const hasMigrationDriver = drivers.some(d => d.id === 'migration_double_cost');
  const hasShortHorizon = drivers.some(d => d.id === 'short_horizon');
  if ((hasMigrationDriver || hasShortHorizon) && comparison.optimisticPositive) {
    return 'negative_transition';
  }

  // ROI negativo válido y explicable
  return 'negative_valid';
}

// ─── Textos por estado ────────────────────────────────────────────────────────

interface InterpretationTexts {
  badgeLabel: string;
  headline: string;
  context: string;
}

function buildTexts(
  status: ROIStatus,
  state: SimulationState,
  results: CalculationResults,
  comparison: ROIScenarioComparison,
  drivers: ROIDriver[],
): InterpretationTexts {
  const exp = results.scenarios.expected;
  const { profile, incidents } = state;
  const hasAPMBlock = state.blocks.activeBlocks.includes('commercial_apm') || profile.startingPoint === 'commercial_apm';
  const hasMigration = state.blocks.activeBlocks.includes('migration');
  const clientRef = profile.clientName ? `Para ${profile.clientName}` : 'En este escenario';

  switch (status) {

    case 'positive': {
      const posCount = comparison.positiveCount;
      return {
        badgeLabel: 'ROI positivo',
        headline: `El escenario esperado proyecta un ROI del ${formatPercent(exp.roi, 1)} con payback en ${exp.paybackMonths <= 999 ? `${exp.paybackMonths} meses` : 'más de 36 meses'}.`,
        context: `${clientRef}, los beneficios estimados superan el costo anual de Instana en el escenario esperado. ${posCount === 3 ? 'Los tres escenarios son positivos, lo que indica robustez del caso de negocio.' : `Solo ${posCount} de los 3 escenarios son positivos. Revisar el escenario conservador para entender los límites inferiores.`} Los supuestos son editables en la sección de escenarios.`,
      };
    }

    case 'requires_review': {
      const missingItems: string[] = [];
      if (drivers.some(d => d.id === 'no_instana_cost')) missingItems.push('costo anual de Instana');
      if (drivers.some(d => d.id === 'no_apm_cost')) missingItems.push('costo del APM actual');
      if (drivers.some(d => d.id === 'instana_more_expensive')) missingItems.push('consistencia entre costo APM e Instana');
      return {
        badgeLabel: 'Requiere revisión',
        headline: 'El resultado requiere revisión antes de ser presentado: faltan datos clave o hay inconsistencias en los valores ingresados.',
        context: `El ROI negativo actual puede deberse a una limitación de los datos disponibles, no a la inviabilidad del proyecto. ${missingItems.length > 0 ? `Validar: ${missingItems.join(', ')}.` : ''} Una vez corregidos estos puntos, el cálculo será más representativo de la situación real del cliente.`,
      };
    }

    case 'negative_insufficient_data': {
      return {
        badgeLabel: 'Datos insuficientes',
        headline: `Con solo el ${Math.round(results.dataCompleteness)}% de datos reales, el nivel de confianza es bajo. El ROI negativo puede cambiar significativamente al ingresar valores reales.`,
        context: `${clientRef}, la mayoría de los valores provienen de supuestos estimados por industria y criticidad. Este resultado es orientativo pero no debe usarse como referencia ejecutiva sin validar primero los campos críticos: costo del APM actual o herramienta OSS, costo de Instana, frecuencia y duración real de incidentes, y costo hora del equipo.`,
      };
    }

    case 'negative_transition': {
      const opt = results.scenarios.optimistic;
      const period = state.migrationBlock.coexistencePeriod;
      const periodMap: Record<string, string> = { '1m': '1 mes', '3m': '3 meses', '6m': '6 meses', '12m': '12 meses' };
      return {
        badgeLabel: 'Impactado por transición',
        headline: `El ROI negativo en el escenario esperado está principalmente impactado por costos de transición o el horizonte de análisis. A ${profile.horizon} meses, el escenario optimista ya es positivo (${formatPercent(opt.roi, 1)}).`,
        context: `${clientRef}, el período de coexistencia ${period ? `(${periodMap[period] ?? period})` : ''} y los costos de implementación reducen el ROI del primer ciclo. Esto es esperado en proyectos de reemplazo o migración. El análisis a 24 o 36 meses mostrará el verdadero retorno una vez absorbida la inversión inicial. El payback estimado en el escenario esperado es de ${exp.paybackMonths <= 999 ? `${exp.paybackMonths} meses` : 'más de 36 meses'}.`,
      };
    }

    case 'negative_valid': {
      // Determine the most prominent reason
      const isAdoption = ['no_apm', 'basic_monitoring'].includes(profile.startingPoint);
      const isLowIncidents = ['0-1', '2-4'].includes(incidents.incidentFrequency);
      const somePositive = comparison.optimisticPositive || comparison.expectedPositive;
      const hasAPMButNoAHorro = hasAPMBlock && !drivers.some(d => d.id === 'no_apm_cost');

      if (isAdoption) {
        return {
          badgeLabel: 'ROI negativo válido',
          headline: `El ROI negativo es consistente con un escenario de adopción inicial de observabilidad, sin costo de referencia equivalente a eliminar.`,
          context: `${clientRef}, Instana representa una inversión nueva. En escenarios de adopción, los beneficios son principalmente estratégicos: visibilidad operativa, reducción de riesgo, capacidad de detección y respuesta. El valor financiero directo tarda en materializarse. Para fortalecer el caso de negocio, cuantificar el impacto de incidentes pasados no detectados o el costo de expansión sin observabilidad.`,
        };
      }
      if (isLowIncidents && !hasAPMButNoAHorro) {
        return {
          badgeLabel: 'ROI negativo válido',
          headline: `El beneficio simulado es bajo porque la frecuencia de incidentes y el impacto en war rooms declarados son reducidos.`,
          context: `Con ${incidents.incidentFrequency === '0-1' ? 'menos de 1 incidente por mes' : '2 a 4 incidentes por mes'}, el ahorro por reducción de war rooms es limitado. El caso de negocio puede fortalecerse enfocando el valor en cobertura de aplicaciones no monitoreadas, reducción de riesgo regulatorio, estandarización con OpenTelemetry o eficiencia en el ciclo de desarrollo. ${somePositive ? 'El escenario optimista muestra un resultado positivo si se capturan todos los beneficios potenciales.' : ''}`,
        };
      }
      if (hasMigration) {
        return {
          badgeLabel: 'ROI negativo válido',
          headline: `El ROI puede ser negativo en el primer año pero la tendencia a 24–36 meses es favorable si el cliente reemplaza su herramienta actual.`,
          context: `${clientRef}, la migración desde la herramienta actual implica costos de transición que presionan el primer año. Analizar el TCO acumulado a 36 meses, donde la diferencia entre mantener el status quo y adoptar Instana tiende a ser positiva para el cliente.`,
        };
      }
      return {
        badgeLabel: 'ROI negativo válido',
        headline: `El ROI negativo es matemáticamente válido dado el conjunto de datos y supuestos actuales. ${comparison.optimisticPositive ? 'El escenario optimista sí es positivo.' : 'Ningún escenario resulta positivo con los valores actuales.'}`,
        context: `${clientRef}, los beneficios simulados no alcanzan a compensar el costo de Instana en el escenario esperado. Esto puede reflejar una realidad genuina del contexto del cliente, o indicar que hay componentes de valor no capturados en el simulador. Revisar si hay impacto de negocio no cuantificado (SLA, riesgo regulatorio, expansión futura) antes de concluir que el proyecto no tiene justificación.`,
      };
    }
  }
}

// ─── Sugerencias de validación ────────────────────────────────────────────────

function buildValidationSuggestions(
  status: ROIStatus,
  state: SimulationState,
  results: CalculationResults,
  drivers: ROIDriver[],
): string[] {
  const suggestions: string[] = [];
  const driverIds = drivers.map(d => d.id);

  if (driverIds.includes('no_instana_cost')) {
    suggestions.push('Ingresar el costo anual de Instana en la sección "Costos de Instana" (campo obligatorio para cualquier análisis de ROI).');
  }
  if (driverIds.includes('no_apm_cost')) {
    suggestions.push(`Cargar el costo anual actual de ${label(APM_TOOL_LABELS, state.apmBlock.tool, state.apmBlock.tool)} en el bloque "APM comercial actual". Es el principal componente de ahorro por reemplazo.`);
  }
  if (driverIds.includes('no_oss_tco')) {
    suggestions.push('Completar el bloque open source con costo mensual de infraestructura y horas de mantenimiento para cuantificar el TCO a reducir.');
  }
  if (driverIds.includes('insufficient_data') || status === 'negative_insufficient_data') {
    suggestions.push('Validar con el cliente: frecuencia real de incidentes por mes, duración promedio de war rooms y cantidad de personas involucradas.');
    suggestions.push('Confirmar el costo hora promedio del equipo técnico (actualmente se usa un estimado por industria).');
  }
  if (driverIds.includes('short_horizon')) {
    suggestions.push('Cambiar el horizonte de análisis a 24 o 36 meses para reflejar mejor el ciclo de retorno de la inversión.');
  }
  if (driverIds.includes('low_incidents') && results.dataCompleteness < 60) {
    suggestions.push('Confirmar con el cliente si la frecuencia de incidentes declarada representa todos los eventos relevantes, incluyendo degradaciones y alertas silenciosas.');
  }
  if (driverIds.includes('instana_more_expensive')) {
    suggestions.push('Revisar si el costo de Instana ingresado corresponde al scope correcto (por ejemplo, si incluye logs, synthetic o módulos adicionales que no estaban en la herramienta anterior).');
    suggestions.push('Validar si el APM actual cubre el mismo universo de aplicaciones que se planea monitorear con Instana.');
  }
  if (status === 'requires_review') {
    suggestions.push('No presentar este resultado a nivel ejecutivo hasta completar los campos marcados como críticos.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Revisar si los supuestos de escenario (porcentajes de mejora) son apropiados para el contexto del cliente.');
    suggestions.push('Consultar si existe impacto regulatorio, de SLA o de expansión futura que no está capturado en el simulador.');
  }
  return suggestions;
}

// ─── Acciones de mejora ───────────────────────────────────────────────────────

function buildImprovementActions(
  status: ROIStatus,
  state: SimulationState,
  results: CalculationResults,
  drivers: ROIDriver[],
): string[] {
  const actions: string[] = [];
  const driverIds = drivers.map(d => d.id);
  const exp = results.scenarios.expected;
  const hasAPMBlock = state.blocks.activeBlocks.includes('commercial_apm') || state.profile.startingPoint === 'commercial_apm';
  const hasFragBlock = state.blocks.activeBlocks.includes('fragmentation');
  const hasOSSBlock = state.blocks.activeBlocks.includes('open_source') || state.profile.startingPoint === 'open_source';

  if (status === 'requires_review' || status === 'negative_insufficient_data') {
    actions.push('Completar primero los campos faltantes antes de evaluar cambios en el caso de negocio.');
    return actions;
  }

  // Acciones específicas por driver
  if (driverIds.includes('no_apm_cost') || (hasAPMBlock && !state.apmBlock.annualCost)) {
    actions.push('Cargar el costo del APM actual: si es comparable al de Instana o mayor, el caso de negocio mejora sustancialmente.');
  }
  if (driverIds.includes('low_incidents')) {
    actions.push('Ampliar el análisis hacia impactos no operativos: SLA, riesgo regulatorio, cobertura de apps no monitoreadas actualmente.');
    actions.push('Activar el bloque "SLO/SLA y experiencia" para capturar valor por prevención de degradaciones no visibles.');
  }
  if (driverIds.includes('cost_exceeds_benefit')) {
    actions.push('Revisar el scope de Instana: si se puede iniciar con un subset de apps críticas, la inversión inicial es menor y el ROI del primer año mejora.');
    actions.push('Explorar si el cliente puede racionalizar herramientas open source adicionales que actualmente no están cuantificadas.');
  }
  if (driverIds.includes('short_horizon')) {
    actions.push('Cambiar el horizonte a 36 meses: la mayoría de proyectos de observabilidad tienen payback entre 12 y 30 meses.');
  }
  if (driverIds.includes('migration_double_cost')) {
    actions.push('Considerar un plan de migración en fases para reducir el período de coexistencia y el doble costo temporal.');
  }
  if (!hasFragBlock && exp.roi < 0) {
    actions.push('Activar el bloque "Fragmentación de herramientas" si el cliente usa múltiples herramientas de diagnóstico: puede ser una fuente de ahorro significativa.');
  }
  if (!hasOSSBlock && !hasAPMBlock && exp.roi < 0) {
    actions.push('Activar bloques de contexto adicionales (OSS, APM, fragmentación) para capturar más categorías de beneficio en el análisis.');
  }
  if (state.profile.horizon < 36) {
    actions.push(`Evaluar el TCO a 36 meses. El gráfico en el dashboard muestra la proyección acumulada y el punto de cruce con el costo actual.`);
  }
  if (state.scope.criticality === 'low' && exp.roi < 0) {
    actions.push('Si hay un subconjunto de aplicaciones críticas, enfocar el análisis en ellas para maximizar el impacto del ROI en ese universo.');
  }

  if (actions.length === 0) {
    actions.push('Profundizar en el valor estratégico: reducción de riesgo operativo, habilitación de DevOps y mejora de time-to-market pueden justificar la inversión.');
    actions.push('Solicitar una prueba de concepto técnica (POC) para medir el impacto real de Instana en un subset de apps del cliente.');
  }

  return actions;
}

// ─── Narrativa ejecutiva ──────────────────────────────────────────────────────

function buildNarrative(
  status: ROIStatus,
  state: SimulationState,
  results: CalculationResults,
  comparison: ROIScenarioComparison,
): string {
  const exp = results.scenarios.expected;
  const opt = results.scenarios.optimistic;
  const con = results.scenarios.conservative;
  const clientRef = state.profile.clientName || 'El cliente evaluado';
  const currency = state.profile.currency;
  const fmt2 = (v: number) => formatCurrency(v, currency, state.profile.customCurrency);

  const scenarioSummary = [
    `Conservador: ${formatPercent(con.roi, 1)}`,
    `Esperado: ${formatPercent(exp.roi, 1)}`,
    `Optimista: ${formatPercent(opt.roi, 1)}`,
  ].join(' · ');

  const startingPointNarrative = state.profile.startingPoint === 'commercial_apm'
    ? `reemplazo o racionalización de ${label(APM_TOOL_LABELS, state.apmBlock.tool, state.apmBlock.tool)}`
    : state.profile.startingPoint === 'open_source' ? 'migración desde stack open source'
    : state.profile.startingPoint === 'no_apm' ? 'adopción inicial de APM'
    : state.profile.startingPoint === 'basic_monitoring' ? 'optimización de monitoreo básico existente'
    : state.profile.startingPoint === 'multiple_tools' ? 'consolidación de herramientas fragmentadas'
    : label(STARTING_POINT_LABELS, state.profile.startingPoint, 'contexto de observabilidad');
  const baseNarrative = `${clientRef} presenta un caso de observabilidad basado en ${startingPointNarrative}. Los costos anuales estimados de Instana son ${fmt2(results.instanaAnnualCost)}, frente a un beneficio simulado de ${fmt2(exp.totalAnnualBenefit)} en el escenario esperado. Los war rooms representan un costo anual de ${fmt2(results.warRoom.annualCost)}. Resumen de ROI por escenario: ${scenarioSummary}.`;

  if (status === 'positive') {
    return `${baseNarrative} El análisis muestra viabilidad financiera con ROI positivo en el escenario esperado. Payback estimado: ${exp.paybackMonths <= 999 ? `${exp.paybackMonths} meses` : 'mayor a 36 meses'}.`;
  }
  if (status === 'requires_review') {
    return `${baseNarrative} El resultado actual requiere revisión de datos clave antes de ser presentado como referencia. No usar para decisión ejecutiva en estado actual.`;
  }
  if (status === 'negative_insufficient_data') {
    return `${baseNarrative} La confianza del cálculo es baja (${Math.round(results.dataCompleteness)}% datos reales). El resultado puede cambiar significativamente al ingresar datos validados con el cliente.`;
  }
  if (status === 'negative_transition') {
    return `${baseNarrative} El ROI negativo es explicable por costos de transición del primer año. En horizonte de 24-36 meses, la tendencia mejora. Revisar el TCO acumulado para una visión completa.`;
  }
  return `${baseNarrative} El ROI negativo puede responder a factores válidos del contexto del cliente (adopción inicial, bajo volumen de incidentes, delta limitado con APM actual). El valor estratégico puede superar el financiero en este escenario.`;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function interpretROI(
  state: SimulationState,
  results: CalculationResults,
): ROIInterpretation {
  const con = results.scenarios.conservative;
  const exp = results.scenarios.expected;
  const opt = results.scenarios.optimistic;

  const scenarioComparison: ROIScenarioComparison = {
    conservativeROI: con.roi,
    expectedROI: exp.roi,
    optimisticROI: opt.roi,
    conservativePositive: con.roi >= 0,
    expectedPositive: exp.roi >= 0,
    optimisticPositive: opt.roi >= 0,
    positiveCount: [con.roi >= 0, exp.roi >= 0, opt.roi >= 0].filter(Boolean).length,
  };

  const drivers = detectDrivers(state, results);
  const status = classifyStatus(state, results, scenarioComparison, drivers);
  const texts = buildTexts(status, state, results, scenarioComparison, drivers);
  const validationSuggestions = buildValidationSuggestions(status, state, results, drivers);
  const improvementActions = buildImprovementActions(status, state, results, drivers);
  const narrativeSummary = buildNarrative(status, state, results, scenarioComparison);

  return {
    status,
    badgeLabel: texts.badgeLabel,
    headline: texts.headline,
    context: texts.context,
    scenarioComparison,
    drivers,
    validationSuggestions,
    improvementActions,
    isExpectedNegative: exp.roi < 0,
    isAllNegative: !scenarioComparison.conservativePositive && !scenarioComparison.expectedPositive && !scenarioComparison.optimisticPositive,
    narrativeSummary,
  };
}
