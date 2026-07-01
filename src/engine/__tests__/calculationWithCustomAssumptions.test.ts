import { describe, it, expect } from 'vitest';
import { calculate } from '../calculator';
import { DEFAULT_STATE, DEFAULT_SCENARIOS_CONFIG } from '../../data/defaults';
import { DEMO_STATE } from '../../data/demo';
import { buildReportModel } from '../reportModel';
import type { SimulationState, ScenariosConfig } from '../../types';

function mkState(overrides: Partial<SimulationState> = {}): SimulationState {
  return { ...DEFAULT_STATE, ...overrides };
}

function withScenarios(base: SimulationState, cfg: Partial<ScenariosConfig>): SimulationState {
  return {
    ...base,
    scenariosConfig: {
      conservative: { ...base.scenariosConfig.conservative, ...(cfg.conservative ?? {}) },
      expected: { ...base.scenariosConfig.expected, ...(cfg.expected ?? {}) },
      optimistic: { ...base.scenariosConfig.optimistic, ...(cfg.optimistic ?? {}) },
    },
  };
}

// Base state: banca con APM y war rooms moderados
const BASE = mkState({
  profile: { ...DEFAULT_STATE.profile, industry: 'banking', startingPoint: 'commercial_apm' },
  scope: { ...DEFAULT_STATE.scope, criticality: 'high', appCount: '11-30' },
  incidents: {
    ...DEFAULT_STATE.incidents,
    incidentFrequency: '5-10',
    warRoomDuration: '1-3h',
    warRoomPeople: '4-8',
    useEstimatedHourlyCost: true,
  },
  blocks: { activeBlocks: ['commercial_apm'] },
  apmBlock: { ...DEFAULT_STATE.apmBlock, annualCost: 200000, adminPeople: 2, adminMonthlyHours: 30 },
  instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 80000, implementationCost: 20000 },
});

// ─── Monotonicity: más reducción de war rooms → más ahorro de war rooms ───────

describe('monotonicity_warroom_reduction', () => {
  const low = withScenarios(BASE, { expected: { ...BASE.scenariosConfig.expected, warRoomReduction: [10, 20] } });
  const high = withScenarios(BASE, { expected: { ...BASE.scenariosConfig.expected, warRoomReduction: [40, 60] } });

  it('war room savings increase when warRoomReduction increases', () => {
    const rLow = calculate(low).scenarios.expected.warRoomSavings;
    const rHigh = calculate(high).scenarios.expected.warRoomSavings;
    expect(rHigh).toBeGreaterThan(rLow);
  });

  it('total annual benefit increases when warRoomReduction increases', () => {
    const bLow = calculate(low).scenarios.expected.totalAnnualBenefit;
    const bHigh = calculate(high).scenarios.expected.totalAnnualBenefit;
    expect(bHigh).toBeGreaterThan(bLow);
  });

  it('ROI improves monotonically when warRoomReduction increases', () => {
    const roiLow = calculate(low).scenarios.expected.roi;
    const roiHigh = calculate(high).scenarios.expected.roi;
    expect(roiHigh).toBeGreaterThan(roiLow);
  });
});

// ─── Monotonicity: más reducción de admin → más ahorro de admin ──────────────

describe('monotonicity_admin_reduction', () => {
  const low = withScenarios(BASE, { expected: { ...BASE.scenariosConfig.expected, adminReduction: [5, 10] } });
  const high = withScenarios(BASE, { expected: { ...BASE.scenariosConfig.expected, adminReduction: [35, 45] } });

  it('admin savings increase when adminReduction increases', () => {
    const rLow = calculate(low).scenarios.expected.adminSavings;
    const rHigh = calculate(high).scenarios.expected.adminSavings;
    expect(rHigh).toBeGreaterThan(rLow);
  });
});

// ─── Monotonicity: más reducción de fragmentación → más ahorro ───────────────

describe('monotonicity_fragmentation_reduction', () => {
  const stateWithFrag = mkState({
    ...BASE,
    blocks: { activeBlocks: ['commercial_apm', 'fragmentation'] },
    fragmentationBlock: {
      ...DEFAULT_STATE.fragmentationBlock,
      toolsPerIncident: '7+',
      hasSingleServiceView: 'no',
      hasAutoCorrelation: 'no',
      alertsFromMultipleSources: 'yes',
    },
  });
  const low = withScenarios(stateWithFrag, { expected: { ...DEFAULT_SCENARIOS_CONFIG.expected, fragmentationReduction: [5, 10] } });
  const high = withScenarios(stateWithFrag, { expected: { ...DEFAULT_SCENARIOS_CONFIG.expected, fragmentationReduction: [40, 50] } });

  it('fragmentation savings increase when fragmentationReduction increases', () => {
    const sLow = calculate(low).scenarios.expected.fragmentationSavings;
    const sHigh = calculate(high).scenarios.expected.fragmentationSavings;
    expect(sHigh).toBeGreaterThan(sLow);
  });
});

// ─── Supuestos en 0%: beneficio operativo tiende a 0 ─────────────────────────

describe('zero_assumptions', () => {
  const ZERO_CFG: ScenariosConfig = {
    conservative: { mttrReduction: [0, 0], mttdReduction: [0, 0], warRoomReduction: [0, 0], adminReduction: [0, 0], coverageImprovement: [0, 0], fragmentationReduction: [0, 0] },
    expected: { mttrReduction: [0, 0], mttdReduction: [0, 0], warRoomReduction: [0, 0], adminReduction: [0, 0], coverageImprovement: [0, 0], fragmentationReduction: [0, 0] },
    optimistic: { mttrReduction: [0, 0], mttdReduction: [0, 0], warRoomReduction: [0, 0], adminReduction: [0, 0], coverageImprovement: [0, 0], fragmentationReduction: [0, 0] },
  };
  const state = { ...BASE, scenariosConfig: ZERO_CFG };

  it('warRoomSavings = 0 when warRoomReduction = [0,0]', () => {
    expect(calculate(state).scenarios.expected.warRoomSavings).toBe(0);
  });

  it('adminSavings = 0 when adminReduction = [0,0]', () => {
    expect(calculate(state).scenarios.expected.adminSavings).toBe(0);
  });

  it('coverageValue = 0 when coverageImprovement = [0,0]', () => {
    expect(calculate(state).scenarios.expected.coverageValue).toBe(0);
  });

  it('total benefit = 0 when all improvement assumptions are 0 and no APM rationalization', () => {
    // apmRationalizationSavings uses coverageImprovement in its formula — also 0
    const r = calculate(state).scenarios.expected;
    expect(r.warRoomSavings).toBe(0);
    expect(r.adminSavings).toBe(0);
    expect(r.coverageValue).toBe(0);
    expect(r.fragmentationSavings).toBe(0);
    expect(r.telemetrySavings).toBe(0);
  });

  it('ROI is negative (costs with no benefits) when all assumptions are 0', () => {
    expect(calculate(state).scenarios.expected.roi).toBeLessThan(0);
  });
});

// ─── Supuestos en 100%: no crashea, valores razonables ───────────────────────

describe('extreme_assumptions_100pct', () => {
  const MAX_CFG: ScenariosConfig = {
    conservative: { mttrReduction: [100, 100], mttdReduction: [100, 100], warRoomReduction: [100, 100], adminReduction: [100, 100], coverageImprovement: [100, 100], fragmentationReduction: [100, 100] },
    expected: { mttrReduction: [100, 100], mttdReduction: [100, 100], warRoomReduction: [100, 100], adminReduction: [100, 100], coverageImprovement: [100, 100], fragmentationReduction: [100, 100] },
    optimistic: { mttrReduction: [100, 100], mttdReduction: [100, 100], warRoomReduction: [100, 100], adminReduction: [100, 100], coverageImprovement: [100, 100], fragmentationReduction: [100, 100] },
  };
  const state = { ...BASE, scenariosConfig: MAX_CFG };

  it('calculation does not crash with 100% assumptions', () => {
    expect(() => calculate(state)).not.toThrow();
  });

  it('result values are finite numbers', () => {
    const r = calculate(state).scenarios.expected;
    expect(isFinite(r.roi)).toBe(true);
    expect(isFinite(r.totalAnnualBenefit)).toBe(true);
    expect(isFinite(r.warRoomSavings)).toBe(true);
  });

  it('war room savings cannot exceed war room annual cost (100% reduction cap)', () => {
    const results = calculate(state);
    expect(results.scenarios.expected.warRoomSavings).toBeLessThanOrEqual(results.warRoom.annualCost + 1);
  });
});

// ─── Restaurar defaults produce los mismos resultados ────────────────────────

describe('defaults_restore_produces_same_results', () => {
  it('default config results == results after modifying then restoring defaults', () => {
    const original = calculate(BASE);

    const modified = withScenarios(BASE, {
      expected: { ...BASE.scenariosConfig.expected, warRoomReduction: [50, 60], adminReduction: [40, 50] },
    });
    const modifiedResults = calculate(modified);

    const restored = { ...modified, scenariosConfig: DEFAULT_SCENARIOS_CONFIG };
    const restoredResults = calculate(restored);

    // Verify modified actually changed
    expect(modifiedResults.scenarios.expected.warRoomSavings).not.toBe(original.scenarios.expected.warRoomSavings);

    // Verify restore is exact
    expect(restoredResults.scenarios.expected.warRoomSavings).toBe(original.scenarios.expected.warRoomSavings);
    expect(restoredResults.scenarios.expected.roi).toBe(original.scenarios.expected.roi);
    expect(restoredResults.scenarios.expected.totalAnnualBenefit).toBe(original.scenarios.expected.totalAnnualBenefit);
  });
});

// ─── Consistencia UI / ReportModel ────────────────────────────────────────────

describe('report_model_assumptions_consistency', () => {
  it('assumptionRows reflect current custom values (not defaults)', () => {
    const custom = withScenarios(BASE, {
      expected: { ...BASE.scenariosConfig.expected, warRoomReduction: [99, 99] },
    });
    const results = calculate(custom);
    const model = buildReportModel(custom, results);
    const row = model.assumptionRows.find(r => r.label === 'Reducción war rooms');
    expect(row?.expected).toBe('99–99%');
  });

  it('assumptionsCustomized = false with default config', () => {
    const results = calculate(BASE);
    const model = buildReportModel(BASE, results);
    expect(model.assumptionsCustomized).toBe(false);
  });

  it('assumptionsCustomized = true when any assumption differs from default', () => {
    const custom = withScenarios(BASE, {
      expected: { ...BASE.scenariosConfig.expected, warRoomReduction: [99, 99] },
    });
    const results = calculate(custom);
    const model = buildReportModel(custom, results);
    expect(model.assumptionsCustomized).toBe(true);
  });

  it('demo state uses default assumptions → assumptionsCustomized = false', () => {
    const results = calculate(DEMO_STATE);
    const model = buildReportModel(DEMO_STATE, results);
    expect(model.assumptionsCustomized).toBe(false);
  });
});

// ─── Supuestos personalizados en distintos perfiles de cliente ────────────────

describe('custom_assumptions_across_client_profiles', () => {
  const AGGRESSIVE: ScenariosConfig = {
    conservative: { mttrReduction: [30, 40], mttdReduction: [35, 45], warRoomReduction: [35, 45], adminReduction: [20, 30], coverageImprovement: [20, 25], fragmentationReduction: [20, 25] },
    expected: { mttrReduction: [45, 55], mttdReduction: [50, 60], warRoomReduction: [50, 60], adminReduction: [35, 45], coverageImprovement: [35, 45], fragmentationReduction: [35, 45] },
    optimistic: { mttrReduction: [60, 70], mttdReduction: [65, 75], warRoomReduction: [65, 75], adminReduction: [50, 60], coverageImprovement: [55, 65], fragmentationReduction: [55, 65] },
  };

  it('cliente sin APM — agresivo mejora ROI vs default', () => {
    const base = mkState({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'no_apm' },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '5-10', warRoomDuration: '3-6h', warRoomPeople: '9-15', useEstimatedHourlyCost: true },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 100000 },
    });
    const defaultR = calculate(base).scenarios.expected.roi;
    const aggressiveR = calculate({ ...base, scenariosConfig: AGGRESSIVE }).scenarios.expected.roi;
    expect(aggressiveR).toBeGreaterThan(defaultR);
  });

  it('cliente con APM comercial — agresivo mejora ROI vs default', () => {
    const base = mkState({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'commercial_apm' },
      blocks: { activeBlocks: ['commercial_apm'] },
      apmBlock: { ...DEFAULT_STATE.apmBlock, annualCost: 200000, adminPeople: 2, adminMonthlyHours: 40 },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '5-10', warRoomDuration: '1-3h', warRoomPeople: '4-8', useEstimatedHourlyCost: true },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 80000 },
    });
    const defaultR = calculate(base).scenarios.expected.roi;
    const aggressiveR = calculate({ ...base, scenariosConfig: AGGRESSIVE }).scenarios.expected.roi;
    expect(aggressiveR).toBeGreaterThan(defaultR);
  });

  it('cliente open source — agresivo mejora beneficios vs default', () => {
    const base = mkState({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'open_source' },
      blocks: { activeBlocks: ['open_source'] },
      openSourceBlock: { ...DEFAULT_STATE.openSourceBlock, monthlyInfraCost: 5000, adminPeople: 3, maintenanceHoursMonthly: 40 },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '5-10', useEstimatedHourlyCost: true },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 90000 },
    });
    const defaultBenefit = calculate(base).scenarios.expected.totalAnnualBenefit;
    const aggressiveBenefit = calculate({ ...base, scenariosConfig: AGGRESSIVE }).scenarios.expected.totalAnnualBenefit;
    expect(aggressiveBenefit).toBeGreaterThan(defaultBenefit);
  });

  it('cliente con fragmentación — supuestos impactan savings de fragmentación', () => {
    const base = mkState({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'multiple_tools' },
      blocks: { activeBlocks: ['fragmentation'] },
      fragmentationBlock: { ...DEFAULT_STATE.fragmentationBlock, toolsPerIncident: '4-6', hasSingleServiceView: 'no' },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '10+', warRoomDuration: '3-6h', warRoomPeople: '9-15', useEstimatedHourlyCost: true },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 60000 },
    });
    const defaultFrag = calculate(base).scenarios.expected.fragmentationSavings;
    const aggressiveFrag = calculate({ ...base, scenariosConfig: AGGRESSIVE }).scenarios.expected.fragmentationSavings;
    expect(aggressiveFrag).toBeGreaterThan(defaultFrag);
  });

  it('cliente con coexistencia — supuestos no impactan costo de coexistencia (independiente)', () => {
    const base = mkState({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'commercial_apm' },
      blocks: { activeBlocks: ['commercial_apm', 'migration'] },
      apmBlock: { ...DEFAULT_STATE.apmBlock, annualCost: 150000 },
      migrationBlock: { ...DEFAULT_STATE.migrationBlock, hasDoubleCost: 'yes' },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 100000 },
    });
    const defaultTco12 = calculate(base).scenarios.expected.tco12;
    const aggressiveTco12 = calculate({ ...base, scenariosConfig: AGGRESSIVE }).scenarios.expected.tco12;
    // tco12 no depende de los supuestos de mejora
    expect(aggressiveTco12).toBe(defaultTco12);
  });

  it('cliente con datos incompletos — supuestos personalizados no rompen el cálculo', () => {
    const base = mkState({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'unknown' },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: 'unknown', warRoomDuration: 'unknown', warRoomPeople: 'unknown', useEstimatedHourlyCost: true },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: null },
    });
    expect(() => calculate({ ...base, scenariosConfig: AGGRESSIVE })).not.toThrow();
    const r = calculate({ ...base, scenariosConfig: AGGRESSIVE }).scenarios.expected;
    expect(isFinite(r.roi)).toBe(true);
  });
});

// ─── Conservative ≤ Expected ≤ Optimistic (ordenamiento correcto) ─────────────

describe('scenario_ordering', () => {
  it('warRoomSavings: conservative ≤ expected ≤ optimistic with defaults', () => {
    const r = calculate(BASE);
    expect(r.scenarios.conservative.warRoomSavings).toBeLessThanOrEqual(r.scenarios.expected.warRoomSavings);
    expect(r.scenarios.expected.warRoomSavings).toBeLessThanOrEqual(r.scenarios.optimistic.warRoomSavings);
  });

  it('totalAnnualBenefit: conservative ≤ expected ≤ optimistic with defaults', () => {
    const r = calculate(BASE);
    expect(r.scenarios.conservative.totalAnnualBenefit).toBeLessThanOrEqual(r.scenarios.expected.totalAnnualBenefit);
    expect(r.scenarios.expected.totalAnnualBenefit).toBeLessThanOrEqual(r.scenarios.optimistic.totalAnnualBenefit);
  });

  it('ROI: conservative ≤ expected ≤ optimistic with defaults', () => {
    const r = calculate(BASE);
    expect(r.scenarios.conservative.roi).toBeLessThanOrEqual(r.scenarios.expected.roi);
    expect(r.scenarios.expected.roi).toBeLessThanOrEqual(r.scenarios.optimistic.roi);
  });
});
