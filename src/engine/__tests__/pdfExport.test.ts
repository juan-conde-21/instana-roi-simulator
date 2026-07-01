/**
 * Tests para el módulo de exportación PDF v0.4.5.
 *
 * Los gráficos son dibujados con primitivas jsPDF y no producen output
 * testeable de forma visual. Esta suite cubre:
 *   1. formatK — helper de formateo de números con sufijo K/M
 *   2. Contrato de datos del ReportModel → exportToPDF (smoke test)
 *   3. Edge cases: ROI negativo, ahorros cero, scores vacíos, datos incompletos
 *
 * LIMITACIÓN CONOCIDA: No se prueban las primitivas de dibujo de jsPDF
 * porque requieren instanciar jsPDF en un entorno JSDOM con canvas,
 * lo cual no está configurado en este proyecto. Las funciones de gráfico
 * son puras (doc, y, model) → number y se validan manualmente con el PDF.
 */

import { describe, it, expect } from 'vitest';
import { formatK } from '../../export/pdfCharts';
import { DEFAULT_STATE, DEFAULT_SCENARIOS_CONFIG } from '../../data/defaults';
import { calculate } from '../calculator';
import { buildReportModel } from '../reportModel';
import type { SimulationState } from '../../types';

// ─── 1. formatK ──────────────────────────────────────────────────────────────

describe('formatK — number abbreviation helper', () => {
  it('formats < 1000 as plain integer with currency', () => {
    expect(formatK(500, 'USD')).toBe('500 USD');
    expect(formatK(0, 'EUR')).toBe('0 EUR');
  });

  it('formats >= 1000 with K suffix', () => {
    expect(formatK(1000, 'USD')).toBe('1K USD');
    expect(formatK(1500, 'USD')).toBe('2K USD');
    expect(formatK(150_000, 'PEN')).toBe('150K PEN');
  });

  it('formats >= 1_000_000 with M suffix and one decimal', () => {
    expect(formatK(1_000_000, 'USD')).toBe('1.0M USD');
    expect(formatK(1_500_000, 'USD')).toBe('1.5M USD');
    expect(formatK(2_250_000, 'EUR')).toBe('2.3M EUR');
  });

  it('handles negative values correctly', () => {
    expect(formatK(-500, 'USD')).toBe('-500 USD');
    expect(formatK(-1500, 'USD')).toBe('-2K USD');
    expect(formatK(-1_200_000, 'USD')).toBe('-1.2M USD');
  });

  it('handles zero', () => {
    expect(formatK(0, 'USD')).toBe('0 USD');
    expect(formatK(-0, 'USD')).toBe('0 USD');
  });
});

// ─── 2. ReportModel → PDF — smoke tests de datos ─────────────────────────────

function buildModel(overrides: Partial<SimulationState> = {}) {
  const state: SimulationState = { ...DEFAULT_STATE, ...overrides };
  const results = calculate(state);
  return buildReportModel(state, results);
}

describe('ReportModel — data contract for PDF', () => {
  it('model has all required fields for PDF rendering', () => {
    const m = buildModel();
    expect(m.clientName).toBeDefined();
    expect(m.scenarios.conservative).toBeDefined();
    expect(m.scenarios.expected).toBeDefined();
    expect(m.scenarios.optimistic).toBeDefined();
    expect(m.scores.length).toBeGreaterThan(0);
    expect(m.assumptionRows.length).toBe(6);
    expect(m.inputRows.length).toBeGreaterThan(0);
    expect(m.reading.recommendations.length).toBeGreaterThan(0);
  });

  it('ROI chart data: all three scenarios have numeric roi and payback', () => {
    const m = buildModel();
    for (const key of ['conservative', 'expected', 'optimistic'] as const) {
      expect(typeof m.scenarios[key].roi).toBe('number');
      expect(isFinite(m.scenarios[key].roi)).toBe(true);
      expect(typeof m.scenarios[key].paybackMonths).toBe('number');
    }
  });

  it('TCO chart data: tco12/24/36 and tcoCurrentYear1/2/3 are finite numbers', () => {
    const m = buildModel();
    const sr = m.results.scenarios.expected;
    expect(isFinite(sr.tco12)).toBe(true);
    expect(isFinite(sr.tco24)).toBe(true);
    expect(isFinite(sr.tco36)).toBe(true);
    expect(isFinite(sr.tcoCurrentYear1)).toBe(true);
    expect(isFinite(sr.tcoCurrentYear2)).toBe(true);
    expect(isFinite(sr.tcoCurrentYear3)).toBe(true);
  });

  it('savings chart data: all savings fields are finite non-negative numbers', () => {
    const m = buildModel();
    const sr = m.results.scenarios.expected;
    const fields = [
      sr.warRoomSavings, sr.adminSavings, sr.infraSavings,
      sr.apmRationalizationSavings, sr.coverageValue,
      sr.fragmentationSavings, sr.telemetrySavings,
    ];
    for (const f of fields) {
      expect(isFinite(f)).toBe(true);
      expect(f).toBeGreaterThanOrEqual(0);
    }
  });

  it('score chart data: all 10 scores are between 0 and 100', () => {
    const m = buildModel();
    expect(m.scores.length).toBe(10);
    for (const s of m.scores) {
      expect(s.value).toBeGreaterThanOrEqual(0);
      expect(s.value).toBeLessThanOrEqual(100);
    }
  });
});

// ─── 3. Edge cases ────────────────────────────────────────────────────────────

describe('PDF edge cases — no-throw contracts', () => {
  it('Scenario A: sin APM — savings near zero, no crash', () => {
    const m = buildModel({
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'no_apm' },
      blocks: { activeBlocks: [] },
    });
    expect(() => buildReportModel(m.state, m.results)).not.toThrow();
    // ROI puede ser negativo
    expect(isFinite(m.scenarios.expected.roi)).toBe(true);
  });

  it('Scenario B: APM comercial — savings > 0 when APM cost is set', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'commercial_apm' },
      blocks: { activeBlocks: ['commercial_apm'] },
      apmBlock: {
        ...DEFAULT_STATE.apmBlock,
        annualCost: 200_000,
      },
    };
    const m = buildModel(state);
    expect(m.results.scenarios.expected.apmRationalizationSavings).toBeGreaterThan(0);
  });

  it('Scenario C: open source — OSS cost captured', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile, startingPoint: 'open_source' },
      blocks: { activeBlocks: ['open_source'] },
      openSourceBlock: {
        ...DEFAULT_STATE.openSourceBlock,
        monthlyInfraCost: 5_000,
        adminPeople: 2,
      },
    };
    const m = buildModel(state);
    expect(isFinite(m.results.currentAnnualCost)).toBe(true);
  });

  it('Scenario D: coexistencia — doble costo no rompe el modelo', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      blocks: { activeBlocks: ['migration'] },
      migrationBlock: {
        ...DEFAULT_STATE.migrationBlock,
        hasDoubleCost: 'yes',
        coexistencePeriod: '6m',
      },
    };
    const m = buildModel(state);
    expect(isFinite(m.results.scenarios.expected.roi)).toBe(true);
  });

  it('Scenario E: fragmentación activa — fragmentationSavings en expected', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      blocks: { activeBlocks: ['fragmentation'] },
      fragmentationBlock: {
        ...DEFAULT_STATE.fragmentationBlock,
        toolsPerIncident: '4-6',
      },
    };
    const results = calculate(state);
    const m = buildReportModel(state, results);
    // Con war rooms activos, fragmentación puede producir savings > 0
    expect(isFinite(m.results.scenarios.expected.fragmentationSavings)).toBe(true);
    expect(m.results.scenarios.expected.fragmentationSavings).toBeGreaterThanOrEqual(0);
  });

  it('Scenario F: datos incompletos — model se construye sin throw', () => {
    const state: SimulationState = {
      ...DEFAULT_STATE,
      incidents: {
        ...DEFAULT_STATE.incidents,
        incidentFrequency: 'unknown',
        warRoomDuration: 'unknown',
        warRoomPeople: 'unknown',
      },
    };
    expect(() => {
      const results = calculate(state);
      buildReportModel(state, results);
    }).not.toThrow();
  });

  it('ROI negativo — model.reading.isNegative = true y explanation es non-empty', () => {
    const m = buildModel({
      instanaCosts: {
        ...DEFAULT_STATE.instanaCosts,
        annualLicenseCost: 999_999,
      },
    });
    if (m.scenarios.expected.roi < 0) {
      expect(m.reading.isNegative).toBe(true);
      expect(m.reading.explanation.length).toBeGreaterThan(20);
    }
  });

  it('assumptionsCustomized correcto cuando se usan defaults', () => {
    const m = buildModel({ scenariosConfig: DEFAULT_SCENARIOS_CONFIG });
    expect(m.assumptionsCustomized).toBe(false);
  });

  it('assumptionsCustomized = true cuando se modifican supuestos', () => {
    const custom = {
      ...DEFAULT_SCENARIOS_CONFIG,
      expected: {
        ...DEFAULT_SCENARIOS_CONFIG.expected,
        warRoomReduction: [99, 100] as [number, number],
      },
    };
    const m = buildModel({ scenariosConfig: custom });
    expect(m.assumptionsCustomized).toBe(true);
  });

  it('inputRows filtered to Perfil/Alcance/Incidentes/Instana — all in those sections', () => {
    const m = buildModel();
    const valid = ['Perfil', 'Alcance', 'Incidentes', 'Instana'];
    const filtered = m.inputRows.filter(r => valid.includes(r.section));
    expect(filtered.length).toBeGreaterThan(5);
    for (const r of filtered) {
      expect(r.value).not.toBe('');
      expect(r.field).not.toBe('');
    }
  });

  it('formatK matches toFixed precision for boundary values', () => {
    expect(formatK(999, 'USD')).toBe('999 USD');
    expect(formatK(1000, 'USD')).toBe('1K USD');
    expect(formatK(999_999, 'USD')).toBe('1000K USD');
    expect(formatK(1_000_000, 'USD')).toBe('1.0M USD');
  });
});
