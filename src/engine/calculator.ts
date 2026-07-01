import type {
  SimulationState, CalculationResults, WarRoomMetrics,
  ScenarioResult, Scores, ROITypes, ConfidenceLevel, ScenarioType,
  ScenarioAssumptions
} from '../types';
import {
  INDUSTRY_HOURLY_COSTS, CRITICALITY_MULTIPLIERS,
  INCIDENT_FREQUENCY_MAP, WAR_ROOM_DURATION_MAP, WAR_ROOM_PEOPLE_MAP,
} from '../data/defaults';
import { calculateInstanaCostBreakdown } from './instanaPricing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function midpoint(range: [number, number]): number {
  return (range[0] + range[1]) / 2 / 100;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

function countTrue(obj: Record<string, boolean>): number {
  return Object.values(obj).filter(Boolean).length;
}

// ─── Costo hora estimado por industria ───────────────────────────────────────

function resolveHourlyCost(state: SimulationState): number {
  const { incidents, profile } = state;
  if (!incidents.useEstimatedHourlyCost && incidents.hourlyTeamCost != null && incidents.hourlyTeamCost > 0) {
    return incidents.hourlyTeamCost;
  }
  return INDUSTRY_HOURLY_COSTS[profile.industry] ?? 80;
}

// ─── Métricas war room ────────────────────────────────────────────────────────

export function calcWarRoomMetrics(state: SimulationState): WarRoomMetrics {
  const freq = INCIDENT_FREQUENCY_MAP[state.incidents.incidentFrequency] ?? 3;
  const duration = WAR_ROOM_DURATION_MAP[state.incidents.warRoomDuration] ?? 2;
  const people = WAR_ROOM_PEOPLE_MAP[state.incidents.warRoomPeople] ?? 6;
  const criticality = CRITICALITY_MULTIPLIERS[state.scope.criticality] ?? 1;
  const hourlyCost = resolveHourlyCost(state);

  const monthlyManHours = freq * duration * people;
  const monthlyCost = monthlyManHours * hourlyCost * criticality;
  const annualCost = monthlyCost * 12;

  return { monthlyManHours, monthlyCost, annualCost, hourlyTeamCostUsed: hourlyCost };
}

// ─── Costo actual anual ───────────────────────────────────────────────────────

function calcCurrentAnnualCost(state: SimulationState, warRoomAnnual: number): number {
  let total = warRoomAnnual;

  // APM comercial
  if (
    state.blocks.activeBlocks.includes('commercial_apm') ||
    state.profile.startingPoint === 'commercial_apm'
  ) {
    total += state.apmBlock.annualCost ?? 0;
    const adminCost = (state.apmBlock.adminMonthlyHours ?? 0) *
      (state.apmBlock.adminPeople ?? 0) * resolveHourlyCost(state) * 12;
    total += adminCost;
  }

  // Open source
  if (
    state.blocks.activeBlocks.includes('open_source') ||
    state.profile.startingPoint === 'open_source'
  ) {
    const infraAnnual = (state.openSourceBlock.monthlyInfraCost ?? 0) * 12;
    const adminCost = (state.openSourceBlock.maintenanceHoursMonthly ?? 0) *
      (state.openSourceBlock.adminPeople ?? 0) * resolveHourlyCost(state) * 12;
    total += infraAnnual + adminCost;
  }

  return total;
}

// ─── Costo total Instana ──────────────────────────────────────────────────────

function calcInstanaAnnualCost(state: SimulationState): number {
  return calculateInstanaCostBreakdown(state.instanaCosts, state.profile.horizon).annualEquivalent;
}

// ─── Ahorro por escenario ─────────────────────────────────────────────────────

function calcScenarioResult(
  scenario: ScenarioType,
  assumptions: ScenarioAssumptions,
  state: SimulationState,
  warRoom: WarRoomMetrics,
  currentCost: number,
  instanaCost: number,
): ScenarioResult {
  const hourlyCost = resolveHourlyCost(state);

  // War room savings
  const warRoomReductionRate = midpoint(assumptions.warRoomReduction);
  const warRoomSavings = warRoom.annualCost * warRoomReductionRate;

  // Admin savings (APM)
  let adminSavings = 0;
  if (
    state.blocks.activeBlocks.includes('commercial_apm') ||
    state.profile.startingPoint === 'commercial_apm'
  ) {
    const adminHours = (state.apmBlock.adminMonthlyHours ?? 0) *
      (state.apmBlock.adminPeople ?? 0) * 12;
    adminSavings += adminHours * hourlyCost * midpoint(assumptions.adminReduction);
  }
  if (
    state.blocks.activeBlocks.includes('open_source') ||
    state.profile.startingPoint === 'open_source'
  ) {
    const osAdminHours = (state.openSourceBlock.maintenanceHoursMonthly ?? 0) *
      (state.openSourceBlock.adminPeople ?? 0) * 12;
    adminSavings += osAdminHours * hourlyCost * midpoint(assumptions.adminReduction);
  }

  // Infrastructure savings (open source)
  let infraSavings = 0;
  if (
    state.blocks.activeBlocks.includes('open_source') ||
    state.profile.startingPoint === 'open_source'
  ) {
    const infraAnnual = (state.openSourceBlock.monthlyInfraCost ?? 0) * 12;
    infraSavings = infraAnnual * midpoint(assumptions.adminReduction);
  }

  // APM rationalization
  let apmRationalizationSavings = 0;
  if (
    state.blocks.activeBlocks.includes('commercial_apm') ||
    state.profile.startingPoint === 'commercial_apm'
  ) {
    const apmCost = state.apmBlock.annualCost ?? 0;
    // Only flag as potential saving if replacing, not necessarily immediate
    apmRationalizationSavings = apmCost * 0.3 * midpoint(assumptions.coverageImprovement) * 2;
  }

  // Coverage value (recovered applications)
  const appCountMid: Record<string, number> = {
    '1-3': 2, '4-10': 7, '11-30': 20, '31-80': 55, '80+': 100,
  };
  const appCount = appCountMid[state.scope.appCount] ?? 10;
  const critMulti = CRITICALITY_MULTIPLIERS[state.scope.criticality] ?? 1;
  const coverageValue = appCount * critMulti * hourlyCost * 20 *
    midpoint(assumptions.coverageImprovement);

  // Fragmentation savings
  let fragmentationSavings = 0;
  if (state.blocks.activeBlocks.includes('fragmentation')) {
    const toolsMap: Record<string, number> = { '1': 0, '2-3': 1.2, '4-6': 2.5, '7+': 4 };
    const toolFactor = toolsMap[state.fragmentationBlock.toolsPerIncident] ?? 1;
    fragmentationSavings = warRoom.monthlyManHours * toolFactor * hourlyCost *
      12 * midpoint(assumptions.fragmentationReduction) * 0.3;
  }

  // Telemetry governance savings
  let telemetrySavings = 0;
  if (state.blocks.activeBlocks.includes('governance')) {
    const volScore =
      (['high', 'critical'].includes(state.governanceBlock.logsVolume) ? 1 : 0) +
      (['high', 'critical'].includes(state.governanceBlock.tracesVolume) ? 1 : 0) +
      (['high', 'critical'].includes(state.governanceBlock.metricsVolume) ? 1 : 0);
    // Only use OSS infra cost when the open_source block is actually active
    const hasOSSActive = state.blocks.activeBlocks.includes('open_source') || state.profile.startingPoint === 'open_source';
    const infraBase = hasOSSActive ? (state.openSourceBlock.monthlyInfraCost ?? 0) * 12 : 0;
    if (infraBase > 0 && volScore > 0) {
      telemetrySavings = infraBase * (volScore / 3) * 0.25 * midpoint(assumptions.adminReduction);
    }
  }

  const totalAnnualBenefit =
    warRoomSavings + adminSavings + infraSavings +
    apmRationalizationSavings + coverageValue +
    fragmentationSavings + telemetrySavings;

  const totalAnnualCostInstana = instanaCost;
  const netAnnualBenefit = totalAnnualBenefit - totalAnnualCostInstana;
  const roi = totalAnnualCostInstana > 0
    ? (netAnnualBenefit / totalAnnualCostInstana) * 100
    : 0;

  const monthlyNet = netAnnualBenefit / 12;
  const initialInvestment = (state.instanaCosts.implementationCost ?? 0) +
    (state.instanaCosts.trainingCost ?? 0) +
    (state.instanaCosts.professionalServicesCost ?? 0);
  const paybackMonths = monthlyNet > 0 ? Math.ceil(initialInvestment / monthlyNet) : 999;

  // TCO projections
  const coexistenceFactor = state.blocks.activeBlocks.includes('migration') &&
    state.migrationBlock.hasDoubleCost === 'yes'
    ? instanaCost * 0.5 : 0;

  const tcoCurrentYear1 = currentCost;
  const tcoCurrentYear2 = currentCost * 1.1;
  const tcoCurrentYear3 = currentCost * 1.21;

  const tco12 = totalAnnualCostInstana + coexistenceFactor;
  const tco24 = totalAnnualCostInstana * 2;
  const tco36 = totalAnnualCostInstana * 3;

  return {
    scenario,
    warRoomSavings, adminSavings, infraSavings,
    apmRationalizationSavings, coverageValue,
    fragmentationSavings, telemetrySavings,
    totalAnnualBenefit, totalAnnualCostInstana,
    netAnnualBenefit, roi, paybackMonths,
    tco12, tco24, tco36,
    tcoCurrentYear1, tcoCurrentYear2, tcoCurrentYear3,
  };
}

// ─── Scores ───────────────────────────────────────────────────────────────────

function calcScores(state: SimulationState): Scores {
  const { apmBlock, openSourceBlock, fragmentationBlock, governanceBlock, otelBlock, migrationBlock } = state;
  const hasAPMBlock = state.blocks.activeBlocks.includes('commercial_apm') || state.profile.startingPoint === 'commercial_apm';
  const hasOSSBlock = state.blocks.activeBlocks.includes('open_source') || state.profile.startingPoint === 'open_source';
  const hasFragBlock = state.blocks.activeBlocks.includes('fragmentation');
  const hasGovBlock = state.blocks.activeBlocks.includes('governance');

  // Cost Pressure (APM) — only when APM block active
  const costConcernMap: Record<string, number> = { low: 10, medium: 40, high: 75, critical: 100 };
  const costPressure = hasAPMBlock ? clamp(
    (costConcernMap[apmBlock.costConcern] ?? 40) +
    (apmBlock.consumptionPredictable === 'no' ? 20 : apmBlock.consumptionPredictable === 'partially' ? 10 : 0) +
    (apmBlock.costLimitsCoverage === 'avoid_instrumentation' ? 20 :
      apmBlock.costLimitsCoverage === 'only_critical' ? 15 :
      apmBlock.costLimitsCoverage === 'some_apps_missing' ? 8 : 0)
  ) : 0;

  // APM Utilization — only when APM block active
  const usedCount = hasAPMBlock ? countTrue(apmBlock.capabilitiesUsed as unknown as Record<string, boolean>) : 0;
  const unusedCount = hasAPMBlock ? countTrue(apmBlock.capabilitiesAvailableUnused as unknown as Record<string, boolean>) : 0;
  const totalCaps = 13;
  const apmUtilization = (hasAPMBlock && usedCount > 0)
    ? clamp(((usedCount - unusedCount) / totalCaps) * 100)
    : 0;

  // Coverage Restriction — only when APM block active
  const coverageMap: Record<string, number> = {
    no: 0, some_apps_missing: 30, only_critical: 60, avoid_instrumentation: 90, unknown: 20,
  };
  const coverageRestriction = hasAPMBlock ? clamp(coverageMap[apmBlock.costLimitsCoverage] ?? 20) : 0;

  // Operational Drag — incidents always apply; fragmentation data only when block active
  const fragMap: Record<string, number> = { '1': 0, '2-3': 25, '4-6': 60, '7+': 90 };
  const freqMap: Record<string, number> = { '0-1': 0, '2-4': 20, '5-10': 50, '10+': 80, unknown: 20 };
  const operationalDrag = clamp(
    (hasFragBlock ? (fragMap[fragmentationBlock.toolsPerIncident] ?? 25) * 0.4 : 0) +
    (freqMap[state.incidents.incidentFrequency] ?? 20) * 0.4 +
    (hasFragBlock && fragmentationBlock.hasSingleServiceView === 'no' ? 4 : 0)
  );

  // Telemetry Waste — only when governance block active
  const volMap: Record<string, number> = { low: 0, medium: 20, high: 50, critical: 80, unknown: 20 };
  const telemetryWaste = hasGovBlock ? clamp(
    (volMap[governanceBlock.logsVolume] ?? 20) * 0.3 +
    (volMap[governanceBlock.metricsVolume] ?? 20) * 0.2 +
    (governanceBlock.hasDuplicateData === 'yes' ? 25 : 0) +
    (governanceBlock.appliesSampling === 'no' ? 20 : 0) +
    (governanceBlock.cardinalityControl === 'uncontrolled' ? 15 : 0)
  ) : 0;

  // Fragmentation Score — only when fragmentation block active
  const fragmentation = hasFragBlock ? clamp(
    (fragMap[fragmentationBlock.toolsPerIncident] ?? 25) * 0.4 +
    (fragmentationBlock.hasSingleServiceView === 'no' ? 30 : fragmentationBlock.hasSingleServiceView === 'partial' ? 15 : 0) +
    (fragmentationBlock.hasAutoCorrelation === 'no' ? 20 : 0) +
    (fragmentationBlock.alertsFromMultipleSources === 'yes' ? 10 : 0)
  ) : 0;

  // OTel Readiness
  const otelMap: Record<string, number> = { none: 10, poc: 35, some: 60, majority: 85 };
  const otelReadiness = clamp(
    (otelMap[otelBlock.adoptionLevel] ?? 10) * 0.5 +
    (otelBlock.hasStandardInstrumentation === 'yes' ? 25 :
      otelBlock.hasStandardInstrumentation === 'partial' ? 12 : 0) +
    (otelBlock.usesCollector === 'yes' ? 15 : 0) +
    (otelBlock.hasInternalStandards === 'yes' ? 10 : 5)
  );

  // Migration Effort
  const complexMap: Record<string, number> = { low: 20, medium: 50, high: 85 };
  const depMap: Record<string, number> = { low: 5, medium: 15, high: 30, critical: 45 };
  const migrationEffort = clamp(
    (complexMap[migrationBlock.instrumentationComplexity] ?? 50) * 0.4 +
    (depMap[migrationBlock.dashboardDependency] ?? 15) +
    (depMap[migrationBlock.alertsDependency] ?? 15) +
    (migrationBlock.hasDoubleCost === 'yes' ? 20 : 0)
  );

  // Adoption Readiness from OS risk — only when OSS block active; neutral (50) otherwise
  const osRiskMap: Record<string, number> = { low: 5, medium: 20, high: 45, critical: 70 };
  const adoptionReadiness = hasOSSBlock ? clamp(100 -
    (osRiskMap[openSourceBlock.specialistDependency] ?? 20) -
    (openSourceBlock.formalSupport === 'no' ? 15 : 0) -
    (openSourceBlock.internalDocs === 'none' ? 15 : openSourceBlock.internalDocs === 'partial' ? 7 : 0)
  ) : 50;

  // ROI Confidence placeholder – filled in main
  return {
    costPressure, apmUtilization, coverageRestriction,
    operationalDrag, telemetryWaste, fragmentation,
    otelReadiness, migrationEffort, adoptionReadiness,
    roiConfidence: 0,
  };
}

// ─── Completitud de datos / confianza ─────────────────────────────────────────

function calcConfidence(state: SimulationState): { level: ConfidenceLevel; score: number; completeness: number } {
  let filled = 0;
  let total = 0;

  const check = (v: unknown) => {
    total++;
    if (v != null && v !== '' && v !== 'unknown' && v !== false) filled++;
  };

  check(state.profile.clientName);
  check(state.profile.industry !== 'other');
  check(state.incidents.hourlyTeamCost);
  check(state.incidents.incidentFrequency !== 'unknown');
  check(state.incidents.warRoomDuration !== 'unknown');
  check(state.incidents.warRoomPeople !== 'unknown');
  check(calcInstanaAnnualCost(state));
  check(state.instanaCosts.implementationCost);

  if (state.blocks.activeBlocks.includes('commercial_apm') || state.profile.startingPoint === 'commercial_apm') {
    check(state.apmBlock.annualCost);
    check(state.apmBlock.adminMonthlyHours);
    check(state.apmBlock.adminPeople);
  }
  if (state.blocks.activeBlocks.includes('open_source') || state.profile.startingPoint === 'open_source') {
    check(state.openSourceBlock.monthlyInfraCost);
    check(state.openSourceBlock.adminPeople);
    check(state.openSourceBlock.maintenanceHoursMonthly);
  }

  const completeness = total > 0 ? (filled / total) * 100 : 0;
  const score = clamp(completeness);
  const level: ConfidenceLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return { level, score, completeness };
}

// ─── Tipos de ROI ─────────────────────────────────────────────────────────────

function calcROITypes(state: SimulationState): ROITypes {
  const blocks = state.blocks.activeBlocks;
  const sp = state.profile.startingPoint;
  return {
    adoption: sp === 'no_apm' || sp === 'basic_monitoring',
    operationalEfficiency: blocks.includes('fragmentation') || state.incidents.incidentFrequency !== '0-1',
    warRoomReduction: state.incidents.incidentFrequency !== '0-1',
    mttrMttdReduction: true,
    apmCostOptimization: blocks.includes('commercial_apm') || sp === 'commercial_apm',
    openSourceTcoReduction: blocks.includes('open_source') || sp === 'open_source',
    toolConsolidation: blocks.includes('fragmentation') || sp === 'multiple_tools',
    coverageExpansion: state.apmBlock.costLimitsCoverage !== 'no',
    telemetryControl: blocks.includes('governance'),
    operationalRiskReduction: state.scope.criticality === 'high' || state.scope.criticality === 'critical',
    toolTransition: blocks.includes('migration') || blocks.includes('commercial_apm'),
    otelStandardization: blocks.includes('otel'),
  };
}

// ─── Entry point principal ────────────────────────────────────────────────────

export function calculate(state: SimulationState): CalculationResults {
  const warRoom = calcWarRoomMetrics(state);
  const currentAnnualCost = calcCurrentAnnualCost(state, warRoom.annualCost);
  const instanaAnnualCost = calcInstanaAnnualCost(state);

  const scenarios = {
    conservative: calcScenarioResult('conservative', state.scenariosConfig.conservative, state, warRoom, currentAnnualCost, instanaAnnualCost),
    expected: calcScenarioResult('expected', state.scenariosConfig.expected, state, warRoom, currentAnnualCost, instanaAnnualCost),
    optimistic: calcScenarioResult('optimistic', state.scenariosConfig.optimistic, state, warRoom, currentAnnualCost, instanaAnnualCost),
  };

  const scores = calcScores(state);
  const { level: confidenceLevel, score: confidenceScore, completeness: dataCompleteness } = calcConfidence(state);
  scores.roiConfidence = confidenceScore;

  const roiTypes = calcROITypes(state);

  return {
    warRoom,
    scenarios,
    scores,
    roiTypes,
    confidenceLevel,
    confidenceScore,
    currentAnnualCost,
    instanaAnnualCost,
    dataCompleteness,
  };
}
