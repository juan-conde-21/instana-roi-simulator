import { describe, expect, it } from 'vitest';
import { calculate } from '../calculator';
import { calculateInstanaCostBreakdown } from '../instanaPricing';
import { DEFAULT_STATE } from '../../data/defaults';
import type { InstanaCosts, SimulationState } from '../../types';

const detailed = (overrides: Partial<InstanaCosts> = {}): InstanaCosts => ({
  ...DEFAULT_STATE.instanaCosts,
  costMode: 'detailed',
  deploymentModel: 'saas',
  monthOption: 12,
  standardMonthlyUnitPrice: 100,
  essentialsMonthlyUnitPrice: 50,
  ...overrides,
});

const state = (instanaCosts: Partial<InstanaCosts>): SimulationState => ({
  ...DEFAULT_STATE,
  instanaCosts: { ...DEFAULT_STATE.instanaCosts, ...instanaCosts },
});

describe('instana pricing', () => {
  it('calcula costo base Standard', () => {
    const b = calculateInstanaCostBreakdown(detailed({ standardMvsQty: 10, standardMonthlyUnitPrice: 100, standardMonths: 12 }));
    expect(b.standardCost).toBe(12000);
    expect(b.baseCost).toBe(12000);
  });

  it('calcula costo base Essentials', () => {
    const b = calculateInstanaCostBreakdown(detailed({ essentialsMvsQty: 20, essentialsMonthlyUnitPrice: 25, essentialsMonths: 12 }));
    expect(b.essentialsCost).toBe(6000);
  });

  it('mezcla Standard y Essentials', () => {
    const b = calculateInstanaCostBreakdown(detailed({ standardMvsQty: 10, essentialsMvsQty: 20 }));
    expect(b.baseCost).toBe(24000);
  });

  it('aplica descuento', () => {
    const b = calculateInstanaCostBreakdown(detailed({ standardMvsQty: 10, discountPercent: 10 }));
    expect(b.discountAmount).toBe(1200);
    expect(b.discountedBaseCost).toBe(10800);
  });

  it('soporta meses 12, 24 y 36', () => {
    expect(calculateInstanaCostBreakdown(detailed({ monthOption: 12 })).months).toBe(12);
    expect(calculateInstanaCostBreakdown(detailed({ monthOption: 24 })).months).toBe(24);
    expect(calculateInstanaCostBreakdown(detailed({ monthOption: 36 })).months).toBe(36);
  });

  it('advierte minimo MVS', () => {
    const b = calculateInstanaCostBreakdown(detailed({ standardMvsQty: 5, minimumMvsPerPartNumber: 10 }));
    expect(b.warnings.join(' ')).toContain('Cantidad MVS');
  });

  it('calcula fair use de data ingest', () => {
    const b = calculateInstanaCostBreakdown(detailed({ standardMvsQty: 10, essentialsMvsQty: 10, fairUseGbPerStandardMvs: 2, fairUseGbPerEssentialsMvs: 1 }));
    expect(b.includedFairUseGb).toBe(30);
  });

  it('calcula overage de data ingest', () => {
    const b = calculateInstanaCostBreakdown(detailed({ includeDataIngestAddon: true, expectedMonthlyDataIngestGb: 100, includedFairUseGb: 40, calculateIncludedFairUseAutomatically: false, dataIngestAddonGb: 10, dataIngestOnDemandPricePerGb: 2 }));
    expect(b.monthlyDataIngestOverageGb).toBe(50);
    expect(b.dataIngestOverageMonthlyCost).toBe(100);
    expect(b.dataIngestCost).toBe(1200);
  });

  it('calcula logs SaaS por retencion', () => {
    const b = calculateInstanaCostBreakdown(detailed({ includeLogsAddon: true, logsMonthlyGb: 1500, logsRetentionDays: 90, logsUnitSizeGb: 1000, logsUnitPriceMonthly: 200, logsOverageGb: 20, logsOverageUnitSizeGb: 10, logsOverageUnitPrice: 15 }));
    expect(b.logsUnits).toBe(2);
    expect(b.logsOverageUnits).toBe(2);
    expect(b.logsMonthlyCost).toBe(400);
    expect(b.logsOverageCost).toBe(30);
    expect(b.logsCost).toBe(5160);
  });

  it('deja logs Self-Hosted incluido por defecto', () => {
    const b = calculateInstanaCostBreakdown(detailed({ deploymentModel: 'self_hosted', includeLogsAddon: true }));
    expect(b.logsCost).toBe(0);
  });

  it('usa override manual de logs Self-Hosted cuando existe', () => {
    const b = calculateInstanaCostBreakdown(detailed({ deploymentModel: 'self_hosted', includeLogsAddon: true, logsManualCostOverride: 2400 }));
    expect(b.logsCost).toBe(2400);
    expect(b.logsMonthlyCost).toBe(200);
  });

  it('calcula synthetic RU IBM Hosted PoP', () => {
    const b = calculateInstanaCostBreakdown(detailed({ includeSynthetic: true, simpleApiTests: 2, simpleApiExecutionsPerMonth: 1000, ruPerSimpleApiExecution: 1, ruUnitSize: 1000, ruUnitPriceMonthly: 50 }));
    expect(b.syntheticPurchasedRuUnits).toBe(2);
    expect(b.syntheticMonthlyCost).toBe(100);
    expect(b.syntheticCost).toBe(1200);
  });

  it('calcula RU por tipo y aplica minimo configurable', () => {
    const b = calculateInstanaCostBreakdown(detailed({
      includeSynthetic: true,
      simpleApiTests: 1,
      simpleApiExecutionsPerMonth: 100,
      ruPerSimpleApiExecution: 1,
      apiScriptTests: 1,
      apiScriptExecutionsPerMonth: 20,
      ruPerApiScriptExecution: 10,
      browserTests: 1,
      browserExecutionsPerMonth: 5,
      ruPerBrowserExecution: 50,
      ruUnitSize: 1000,
      minimumRuUnitsMonthly: 2,
      ruUnitPriceMonthly: 80,
    }));
    expect(b.simpleApiRuMonthly).toBe(100);
    expect(b.apiScriptRuMonthly).toBe(200);
    expect(b.browserRuMonthly).toBe(250);
    expect(b.syntheticRuMonthly).toBe(550);
    expect(b.syntheticPurchasedRuUnits).toBe(2);
    expect(b.syntheticMonthlyCost).toBe(160);
  });

  it('Customer Private PoP no cobra Managed PoP', () => {
    const b = calculateInstanaCostBreakdown(detailed({ includeSynthetic: true, syntheticExecutionLocation: 'customer_private_pop', simpleApiTests: 2, syntheticManualCostOverride: null }));
    expect(b.syntheticCost).toBe(0);
  });

  it('Self-Hosted no cobra Managed PoP', () => {
    const b = calculateInstanaCostBreakdown(detailed({ deploymentModel: 'self_hosted', includeSynthetic: true }));
    expect(b.syntheticCost).toBe(0);
  });

  it('manual mode conserva compatibilidad', () => {
    const b = calculateInstanaCostBreakdown({ ...DEFAULT_STATE.instanaCosts, annualLicenseCost: 100000 });
    expect(b.mode).toBe('manual');
    expect(b.totalAnnual).toBe(100000);
  });

  it('manual mode no mezcla valores detallados previos', () => {
    const b = calculateInstanaCostBreakdown({
      ...DEFAULT_STATE.instanaCosts,
      costMode: 'manual',
      annualLicenseCost: 60000,
      standardMvsQty: 999,
      standardMonthlyUnitPrice: 999,
      includeDataIngestAddon: true,
      dataIngestAddonGb: 999,
      dataIngestAddonUnitPricePerGb: 999,
    });
    expect(b.totalAnnual).toBe(60000);
    expect(b.standardCost).toBe(60000);
    expect(b.dataIngestCost).toBe(0);
  });

  it('detailed mode alimenta ROI', () => {
    const results = calculate(state({ costMode: 'detailed', standardMvsQty: 10, standardMonthlyUnitPrice: 100, standardMonths: 12 }));
    expect(results.instanaAnnualCost).toBe(12000);
  });

  it('detailed mode ignora costo manual previo para ROI', () => {
    const results = calculate(state({
      costMode: 'detailed',
      annualLicenseCost: 999999,
      standardMvsQty: 50,
      standardMonthlyUnitPrice: 100,
      standardMonths: 12,
    }));
    expect(results.instanaAnnualCost).toBe(60000);
  });
});
