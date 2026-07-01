import { describe, expect, it } from 'vitest';
import { calculate } from '../calculator';
import { validateScenario } from '../validator';
import { DEFAULT_STATE } from '../../data/defaults';
import type { InstanaCosts, SimulationState } from '../../types';

const state = (instanaCosts: Partial<InstanaCosts>): SimulationState => ({
  ...DEFAULT_STATE,
  instanaCosts: { ...DEFAULT_STATE.instanaCosts, ...instanaCosts },
});

const ids = (s: SimulationState) => validateScenario(s, calculate(s)).issues.map(i => i.id);

describe('validator pricing rules', () => {
  it('instana_cost_zero', () => expect(ids(state({ annualLicenseCost: 0 }))).toContain('instana_cost_zero'));
  it('mvs_below_minimum', () => expect(ids(state({ costMode: 'detailed', standardMvsQty: 5, standardMonthlyUnitPrice: 100 }))).toContain('mvs_below_minimum'));
  it('high_discount', () => expect(ids(state({ costMode: 'detailed', standardMvsQty: 10, standardMonthlyUnitPrice: 100, discountPercent: 35 }))).toContain('high_discount'));
  it('data_ingest_over_fair_use', () => expect(ids(state({ costMode: 'detailed', standardMvsQty: 10, standardMonthlyUnitPrice: 100, expectedMonthlyDataIngestGb: 100, includedFairUseGb: 10, calculateIncludedFairUseAutomatically: false }))).toContain('data_ingest_over_fair_use'));
  it('logs_addon_not_applicable_self_hosted', () => expect(ids(state({ costMode: 'detailed', deploymentModel: 'self_hosted', standardMvsQty: 10, standardMonthlyUnitPrice: 100, includeLogsAddon: true }))).toContain('logs_addon_not_applicable_self_hosted'));
  it('synthetic_managed_pop_not_applicable', () => expect(ids(state({ costMode: 'detailed', standardMvsQty: 10, standardMonthlyUnitPrice: 100, includeSynthetic: true, syntheticExecutionLocation: 'customer_private_pop' }))).toContain('synthetic_managed_pop_not_applicable'));
  it('pricing_reference_only', () => expect(ids(state({ annualLicenseCost: 1 }))).toContain('pricing_reference_only'));
});
