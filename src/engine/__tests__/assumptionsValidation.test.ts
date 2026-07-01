import { describe, it, expect } from 'vitest';
import { DEFAULT_STATE, DEFAULT_SCENARIOS_CONFIG } from '../../data/defaults';
import { calculate } from '../calculator';
import { buildReportModel } from '../reportModel';
import type { SimulationState } from '../../types';

// ─── deepMerge: arrays deben preservarse como arrays ─────────────────────────
// Simula lo que hace loadState() cuando el estado viene del localStorage.
// JSON.parse siempre devuelve arrays correctos; deepMerge los debe respetar.

function simulateLoad(stored: unknown): SimulationState {
  // Replicamos deepMerge tal como está en storage.ts
  function deepMerge(defaults: unknown, overrides: unknown): unknown {
    if (typeof defaults !== 'object' || defaults === null) return overrides ?? defaults;
    if (typeof overrides !== 'object' || overrides === null) return defaults;
    if (Array.isArray(overrides)) return overrides;          // fix aplicado
    const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    for (const key of Object.keys(overrides as Record<string, unknown>)) {
      const defVal = (defaults as Record<string, unknown>)[key];
      const ovVal = (overrides as Record<string, unknown>)[key];
      result[key] = deepMerge(defVal, ovVal);
    }
    return result;
  }
  return deepMerge(DEFAULT_STATE, stored) as SimulationState;
}

describe('deepMerge_preserves_arrays', () => {
  it('assumption tuples remain true arrays after deepMerge', () => {
    // Simula un JSON.parse de localStorage con valores personalizados
    const stored = JSON.parse(JSON.stringify({
      ...DEFAULT_STATE,
      scenariosConfig: {
        ...DEFAULT_STATE.scenariosConfig,
        expected: {
          ...DEFAULT_STATE.scenariosConfig.expected,
          warRoomReduction: [42, 58],
        },
      },
    }));
    const loaded = simulateLoad(stored);
    expect(Array.isArray(loaded.scenariosConfig.expected.warRoomReduction)).toBe(true);
    expect(loaded.scenariosConfig.expected.warRoomReduction).toEqual([42, 58]);
  });

  it('default assumptions are arrays after deepMerge with empty overrides', () => {
    const stored = JSON.parse(JSON.stringify(DEFAULT_STATE));
    const loaded = simulateLoad(stored);
    expect(Array.isArray(loaded.scenariosConfig.conservative.mttrReduction)).toBe(true);
    expect(Array.isArray(loaded.scenariosConfig.expected.adminReduction)).toBe(true);
    expect(Array.isArray(loaded.scenariosConfig.optimistic.coverageImprovement)).toBe(true);
  });

  it('all six parameters are arrays in all three scenarios after deepMerge', () => {
    const stored = JSON.parse(JSON.stringify(DEFAULT_STATE));
    const loaded = simulateLoad(stored);
    const params = ['mttrReduction', 'mttdReduction', 'warRoomReduction', 'adminReduction', 'coverageImprovement', 'fragmentationReduction'] as const;
    const scenarios = ['conservative', 'expected', 'optimistic'] as const;
    for (const s of scenarios) {
      for (const p of params) {
        expect(Array.isArray(loaded.scenariosConfig[s][p])).toBe(true);
      }
    }
  });

  it('spread operator works on restored assumptions (would fail with plain object)', () => {
    const stored = JSON.parse(JSON.stringify(DEFAULT_STATE));
    const loaded = simulateLoad(stored);
    // This spread is used in excel.ts — must not throw with a plain object
    expect(() => {
      const row = [...loaded.scenariosConfig.conservative.mttrReduction, ...loaded.scenariosConfig.expected.mttrReduction];
      return row;
    }).not.toThrow();
  });

  it('midpoint calculation works correctly on restored array', () => {
    const stored = JSON.parse(JSON.stringify({
      ...DEFAULT_STATE,
      scenariosConfig: {
        ...DEFAULT_STATE.scenariosConfig,
        expected: { ...DEFAULT_STATE.scenariosConfig.expected, warRoomReduction: [30, 40] },
      },
    }));
    const loaded = simulateLoad(stored);
    // midpoint([30, 40]) = (30 + 40) / 2 / 100 = 0.35
    const r = loaded.scenariosConfig.expected.warRoomReduction;
    const mid = (r[0] + r[1]) / 2 / 100;
    expect(mid).toBeCloseTo(0.35);
  });
});

// ─── Validación de inputs: rangos razonables ──────────────────────────────────

describe('assumption_range_sanity', () => {
  it('min <= max for all default assumptions', () => {
    const params = ['mttrReduction', 'mttdReduction', 'warRoomReduction', 'adminReduction', 'coverageImprovement', 'fragmentationReduction'] as const;
    const scenarios = ['conservative', 'expected', 'optimistic'] as const;
    for (const s of scenarios) {
      for (const p of params) {
        const [lo, hi] = DEFAULT_SCENARIOS_CONFIG[s][p];
        expect(lo).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('conservative <= expected <= optimistic for warRoomReduction midpoints', () => {
    const mid = (r: [number, number]) => (r[0] + r[1]) / 2;
    expect(mid(DEFAULT_SCENARIOS_CONFIG.conservative.warRoomReduction))
      .toBeLessThanOrEqual(mid(DEFAULT_SCENARIOS_CONFIG.expected.warRoomReduction));
    expect(mid(DEFAULT_SCENARIOS_CONFIG.expected.warRoomReduction))
      .toBeLessThanOrEqual(mid(DEFAULT_SCENARIOS_CONFIG.optimistic.warRoomReduction));
  });

  it('conservative <= expected <= optimistic for adminReduction midpoints', () => {
    const mid = (r: [number, number]) => (r[0] + r[1]) / 2;
    expect(mid(DEFAULT_SCENARIOS_CONFIG.conservative.adminReduction))
      .toBeLessThanOrEqual(mid(DEFAULT_SCENARIOS_CONFIG.expected.adminReduction));
    expect(mid(DEFAULT_SCENARIOS_CONFIG.expected.adminReduction))
      .toBeLessThanOrEqual(mid(DEFAULT_SCENARIOS_CONFIG.optimistic.adminReduction));
  });

  it('all default values are in [0, 100] range', () => {
    const params = ['mttrReduction', 'mttdReduction', 'warRoomReduction', 'adminReduction', 'coverageImprovement', 'fragmentationReduction'] as const;
    const scenarios = ['conservative', 'expected', 'optimistic'] as const;
    for (const s of scenarios) {
      for (const p of params) {
        const [lo, hi] = DEFAULT_SCENARIOS_CONFIG[s][p];
        expect(lo).toBeGreaterThanOrEqual(0);
        expect(lo).toBeLessThanOrEqual(100);
        expect(hi).toBeGreaterThanOrEqual(0);
        expect(hi).toBeLessThanOrEqual(100);
      }
    }
  });
});

// ─── Cálculo robusto con valores límite ──────────────────────────────────────

describe('calculation_robustness_with_edge_inputs', () => {
  it('[0, 0] assumptions produce finite result without throwing', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 50000 },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '5-10', warRoomDuration: '1-3h', warRoomPeople: '4-8', useEstimatedHourlyCost: true },
      scenariosConfig: {
        conservative: { mttrReduction: [0, 0], mttdReduction: [0, 0], warRoomReduction: [0, 0], adminReduction: [0, 0], coverageImprovement: [0, 0], fragmentationReduction: [0, 0] },
        expected: { mttrReduction: [0, 0], mttdReduction: [0, 0], warRoomReduction: [0, 0], adminReduction: [0, 0], coverageImprovement: [0, 0], fragmentationReduction: [0, 0] },
        optimistic: { mttrReduction: [0, 0], mttdReduction: [0, 0], warRoomReduction: [0, 0], adminReduction: [0, 0], coverageImprovement: [0, 0], fragmentationReduction: [0, 0] },
      },
    };
    expect(() => calculate(state)).not.toThrow();
    const r = calculate(state).scenarios.expected;
    expect(isFinite(r.roi)).toBe(true);
    expect(isFinite(r.totalAnnualBenefit)).toBe(true);
  });

  it('[100, 100] assumptions produce finite result without throwing', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 50000 },
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '5-10', warRoomDuration: '1-3h', warRoomPeople: '4-8', useEstimatedHourlyCost: true },
      scenariosConfig: {
        conservative: { mttrReduction: [100, 100], mttdReduction: [100, 100], warRoomReduction: [100, 100], adminReduction: [100, 100], coverageImprovement: [100, 100], fragmentationReduction: [100, 100] },
        expected: { mttrReduction: [100, 100], mttdReduction: [100, 100], warRoomReduction: [100, 100], adminReduction: [100, 100], coverageImprovement: [100, 100], fragmentationReduction: [100, 100] },
        optimistic: { mttrReduction: [100, 100], mttdReduction: [100, 100], warRoomReduction: [100, 100], adminReduction: [100, 100], coverageImprovement: [100, 100], fragmentationReduction: [100, 100] },
      },
    };
    expect(() => calculate(state)).not.toThrow();
    const r = calculate(state).scenarios.expected;
    expect(isFinite(r.roi)).toBe(true);
  });

  it('symmetric range [x, x] gives same midpoint as midpoint calculation', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      incidents: { ...DEFAULT_STATE.incidents, incidentFrequency: '5-10', warRoomDuration: '1-3h', warRoomPeople: '4-8', hourlyTeamCost: 100, useEstimatedHourlyCost: false },
      instanaCosts: { ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 50000 },
      scenariosConfig: {
        ...DEFAULT_SCENARIOS_CONFIG,
        expected: { ...DEFAULT_SCENARIOS_CONFIG.expected, warRoomReduction: [50, 50] },
      },
    };
    const rA = calculate(state).scenarios.expected.warRoomSavings;

    const stateB: SimulationState = {
      ...state,
      scenariosConfig: {
        ...DEFAULT_SCENARIOS_CONFIG,
        expected: { ...DEFAULT_SCENARIOS_CONFIG.expected, warRoomReduction: [40, 60] },
      },
    };
    const rB = calculate(stateB).scenarios.expected.warRoomSavings;
    // midpoint([50,50]) = 0.50, midpoint([40,60]) = 0.50 → same result
    expect(rA).toBeCloseTo(rB, 0);
  });
});

// ─── ReportModel: assumptionsCustomized flag es correcto ─────────────────────

describe('report_model_assumptionsCustomized_flag', () => {
  const defaultResults = calculate(DEFAULT_STATE);

  it('false when scenariosConfig matches DEFAULT_SCENARIOS_CONFIG exactly', () => {
    const model = buildReportModel(DEFAULT_STATE, defaultResults);
    expect(model.assumptionsCustomized).toBe(false);
  });

  it('true when any single value is changed', () => {
    const custom: SimulationState = {
      ...DEFAULT_STATE,
      scenariosConfig: {
        ...DEFAULT_SCENARIOS_CONFIG,
        expected: { ...DEFAULT_SCENARIOS_CONFIG.expected, warRoomReduction: [31, 41] },
      },
    };
    const r = calculate(custom);
    const model = buildReportModel(custom, r);
    expect(model.assumptionsCustomized).toBe(true);
  });

  it('false again after restoring defaults', () => {
    const custom: SimulationState = {
      ...DEFAULT_STATE,
      scenariosConfig: {
        ...DEFAULT_SCENARIOS_CONFIG,
        expected: { ...DEFAULT_SCENARIOS_CONFIG.expected, warRoomReduction: [99, 99] },
      },
    };
    const restored: SimulationState = { ...custom, scenariosConfig: DEFAULT_SCENARIOS_CONFIG };
    const r = calculate(restored);
    const model = buildReportModel(restored, r);
    expect(model.assumptionsCustomized).toBe(false);
  });
});
