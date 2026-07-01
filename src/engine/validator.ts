import type { SimulationState, CalculationResults, ValidationIssue, ValidationResult } from '../types';
import { calculateInstanaCostBreakdown } from './instanaPricing';

export function validateScenario(state: SimulationState, results: CalculationResults): ValidationResult {
  const issues: ValidationIssue[] = [];

  const hasAPMBlock = state.blocks.activeBlocks.includes('commercial_apm') || state.profile.startingPoint === 'commercial_apm';
  const isReplacement = state.profile.startingPoint === 'commercial_apm';
  const sr = results.scenarios.expected;
  const instanaPricing = calculateInstanaCostBreakdown(state.instanaCosts, state.profile.horizon);

  if (instanaPricing.totalAnnual === 0) {
    issues.push({
      id: 'instana_cost_zero',
      severity: 'error',
      message: 'Debe ingresar costo manual o calcular costo referencial.',
      field: 'instanaCosts',
      suggestion: 'Usa el modo manual o completa el estimador referencial de costo Instana.',
    });
    issues.push({
      id: 'missing_instana_cost',
      severity: 'error',
      message: 'El costo anual de Instana es obligatorio para calcular el ROI.',
      field: 'instanaCosts',
      suggestion: 'Ingresa costo manual o completa el estimador referencial en el Paso 5.',
    });
  }


  if (instanaPricing.warnings.some(w => w.includes('Cantidad MVS'))) {
    issues.push({
      id: 'mvs_below_minimum',
      severity: 'warning',
      message: 'Cantidad MVS por debajo del minimo referencial. Validar cotizacion.',
      field: 'instanaCosts.standardMvsQty',
      suggestion: 'Revisar la cantidad por linea base y validar el minimo aplicable con cotizacion oficial.',
    });
  }

  if ((state.instanaCosts.discountPercent ?? 0) > 30) {
    issues.push({
      id: 'high_discount',
      severity: 'warning',
      message: 'Descuento alto. Validar proceso comercial.',
      field: 'instanaCosts.discountPercent',
      suggestion: 'No presentar descuentos como garantizados; documentar razon y validacion comercial.',
    });
  }

  if (instanaPricing.monthlyDataIngestOverageGb > 0) {
    issues.push({
      id: 'data_ingest_over_fair_use',
      severity: 'warning',
      message: 'Consumo de data ingest supera fair use estimado.',
      field: 'instanaCosts.expectedMonthlyDataIngestGb',
      suggestion: 'Validar volumen mensual, fair use y posible add-on para evitar doble conteo.',
    });
  }

  if (state.instanaCosts.deploymentModel === 'self_hosted' && state.instanaCosts.includeLogsAddon && state.instanaCosts.logsManualCostOverride == null) {
    issues.push({
      id: 'logs_addon_not_applicable_self_hosted',
      severity: 'warning',
      message: 'Logs add-on SaaS no aplica directamente a Self-Hosted. Revisar configuracion.',
      field: 'instanaCosts.includeLogsAddon',
      suggestion: 'Para Self-Hosted, validar si Logs in Context esta incluido o si se reflejara infraestructura/esfuerzo manual.',
    });
  }

  if (state.instanaCosts.includeSynthetic && (state.instanaCosts.deploymentModel === 'self_hosted' || state.instanaCosts.syntheticExecutionLocation !== 'ibm_hosted_public_pop')) {
    issues.push({
      id: 'synthetic_managed_pop_not_applicable',
      severity: 'warning',
      message: 'Managed PoP no aplica para este escenario.',
      field: 'instanaCosts.syntheticExecutionLocation',
      suggestion: 'No agregar costo Managed PoP cuando se usan PoPs propios o Self-Hosted.',
    });
  }

  issues.push({
    id: 'pricing_reference_only',
    severity: 'info',
    message: 'Estimacion referencial. No reemplaza cotizacion oficial.',
    field: 'instanaCosts',
    suggestion: 'Validar precios, descuentos y add-ons con una cotizacion oficial antes de presentar.',
  });

  // WARNING: Commercial APM starting point but no APM cost entered
  if (isReplacement && hasAPMBlock && (!state.apmBlock.annualCost || state.apmBlock.annualCost === 0)) {
    issues.push({
      id: 'missing_apm_cost',
      severity: 'warning',
      message: 'El punto de partida es "APM comercial" pero no se ingresó el costo anual del APM actual.',
      field: 'apmBlock.annualCost',
      suggestion: 'Ingresa el costo del APM actual para calcular el ahorro de racionalización.',
    });
  }

  // INFO: Inconsistency — "sin APM" como punto de partida pero bloque APM activo
  if (state.profile.startingPoint === 'no_apm' && state.blocks.activeBlocks.includes('commercial_apm')) {
    issues.push({
      id: 'inconsistent_starting_point',
      severity: 'info',
      message: 'El punto de partida es "Sin APM" pero el bloque APM comercial está activo.',
      field: 'blocks.activeBlocks',
      suggestion: 'Verifica si el cliente realmente no tiene APM, o si está en proceso de reemplazo.',
    });
  }

  // WARNING: ROI driver is "costo excesivo" but no APM cost to compare against
  if (
    state.profile.evalDriver === 'cost_excessive' &&
    hasAPMBlock &&
    (!state.apmBlock.annualCost || state.apmBlock.annualCost === 0)
  ) {
    issues.push({
      id: 'cost_driver_no_apm_cost',
      severity: 'warning',
      message: 'El driver de evaluación es "costo excesivo" pero no se ingresó el costo del APM actual.',
      field: 'apmBlock.annualCost',
      suggestion: 'Sin el costo actual es imposible cuantificar el ahorro por racionalización.',
    });
  }

  // WARNING: ROI negativo con beneficio total cero — falta impacto
  if (sr.netAnnualBenefit < 0 && sr.totalAnnualBenefit === 0) {
    issues.push({
      id: 'zero_benefit',
      severity: 'warning',
      message: 'El beneficio anual calculado es $0. Puede faltar información sobre impacto operativo.',
      suggestion: 'Revisa los datos de incidentes (frecuencia, duración, personas) y los bloques opcionales activos.',
    });
  }

  // WARNING: Horizonte de 12 meses con payback que lo supera
  if (state.profile.horizon === 12 && sr.paybackMonths > 12 && sr.paybackMonths < 999) {
    issues.push({
      id: 'payback_exceeds_horizon',
      severity: 'warning',
      message: `El payback estimado (${sr.paybackMonths} meses) supera el horizonte de evaluación (12 meses).`,
      field: 'profile.horizon',
      suggestion: 'Considera extender el horizonte a 24 o 36 meses para capturar el valor completo.',
    });
  }

  // WARNING: Escenario de reemplazo con ahorro de racionalización APM en cero
  if (isReplacement && sr.apmRationalizationSavings === 0) {
    issues.push({
      id: 'replacement_no_apm_savings',
      severity: 'warning',
      message: 'El escenario es de reemplazo de APM comercial pero el ahorro de racionalización es $0.',
      field: 'apmBlock.annualCost',
      suggestion: 'Ingresa el costo anual del APM actual para calcular el ahorro potencial de consolidación.',
    });
  }

  // WARNING: TCO actual supera costo Instana pero ROI es negativo
  // El modelo de ahorro captura solo un % del costo, no el 100%, por diseño
  if (
    results.currentAnnualCost > results.instanaAnnualCost * 1.5 &&
    sr.roi < 0 &&
    results.instanaAnnualCost > 0
  ) {
    issues.push({
      id: 'tco_cost_advantage_uncaptured',
      severity: 'warning',
      message: `El costo actual total supera en más del 50% el costo de Instana, pero el ROI calculado es negativo. El modelo captura solo una fracción del diferencial de costo como ahorro realizable.`,
      suggestion: 'Revisar si los bloques de racionalización APM, OSS y fragmentación están activos y con datos completos.',
    });
  }

  // WARNING: Costo APM ingresado pero bloque APM no activo — dato ignorado
  if (
    state.apmBlock.annualCost && state.apmBlock.annualCost > 0 &&
    !state.blocks.activeBlocks.includes('commercial_apm') &&
    state.profile.startingPoint !== 'commercial_apm'
  ) {
    issues.push({
      id: 'apm_data_block_inactive',
      severity: 'warning',
      message: 'Se ingresó un costo de APM actual pero el bloque "APM comercial" no está activo. El dato no se usa en el cálculo.',
      field: 'blocks.activeBlocks',
      suggestion: 'Activar el bloque "APM comercial actual" para que el costo ingresado se refleje en el análisis.',
    });
  }

  // INFO: Ningún bloque opcional activo — análisis muy limitado
  if (state.blocks.activeBlocks.length === 0) {
    issues.push({
      id: 'no_active_blocks',
      severity: 'info',
      message: 'No hay bloques opcionales activos. El análisis se basa solo en war rooms e incidentes.',
      suggestion: 'Activa los bloques relevantes (APM actual, Open Source, Fragmentación) para un análisis más completo.',
    });
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  const hasWarnings = issues.some(i => i.severity === 'warning');
  const canCalculateROI = !hasErrors;

  return {
    isValid: !hasErrors && !hasWarnings,
    hasErrors,
    hasWarnings,
    issues,
    canCalculateROI,
  };
}
