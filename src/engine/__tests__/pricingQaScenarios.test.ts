import { describe, expect, it } from 'vitest';
import { calculate } from '../calculator';
import { buildReportModel } from '../reportModel';
import { DEFAULT_STATE } from '../../data/defaults';
import type { InstanaCosts } from '../../types';

const modelFor = (instanaCosts: Partial<InstanaCosts>) => {
  const state = { ...DEFAULT_STATE, instanaCosts: { ...DEFAULT_STATE.instanaCosts, ...instanaCosts } };
  return buildReportModel(state, calculate(state));
};

const visibleText = (rows: Array<{ field: string; value: string }>) => rows.map(r => `${r.field} ${r.value}`).join(' ');

describe('QA scenarios pricing Instana', () => {
  const scenarios: Array<{ name: string; costs: Partial<InstanaCosts>; expectedAnnual?: number; expectedRows: string[] }> = [
    {
      name: 'Manual',
      costs: { costMode: 'manual', annualLicenseCost: 60000 },
      expectedAnnual: 60000,
      expectedRows: ['Ingresado manualmente', 'Costo anual manual'],
    },
    {
      name: 'SaaS Standard/APM',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 50, standardMonthlyUnitPrice: 100, standardMonths: 12 },
      expectedAnnual: 60000,
      expectedRows: ['Standard / APM MVS', 'Standard / APM precio mensual unitario'],
    },
    {
      name: 'SaaS Standard + Essentials',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 30, standardMonthlyUnitPrice: 100, standardMonths: 12, essentialsMvsQty: 20, essentialsMonthlyUnitPrice: 50, essentialsMonths: 12 },
      expectedAnnual: 48000,
      expectedRows: ['Essentials / IQM MVS', 'Base Essentials / IQM'],
    },
    {
      name: 'SaaS Data Ingest',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 10, standardMonthlyUnitPrice: 100, essentialsMvsQty: 10, essentialsMonthlyUnitPrice: 50, includeDataIngestAddon: true, expectedMonthlyDataIngestGb: 100, fairUseGbPerStandardMvs: 2, fairUseGbPerEssentialsMvs: 1, dataIngestAddonGb: 10, dataIngestOnDemandPricePerGb: 2 },
      expectedRows: ['Fair use incluido', 'Data Ingest overage mensual', 'Data Ingest costo total'],
    },
    {
      name: 'SaaS Logs',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 10, standardMonthlyUnitPrice: 100, includeLogsAddon: true, logsMonthlyGb: 1500, logsRetentionDays: 60, logsUnitSizeGb: 1000, logsUnitPriceMonthly: 200 },
      expectedRows: ['Logs retencion', 'Logs unidades calculadas', 'Logs costo total'],
    },
    {
      name: 'SaaS Synthetic IBM Hosted PoP',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 10, standardMonthlyUnitPrice: 100, includeSynthetic: true, simpleApiTests: 1, simpleApiExecutionsPerMonth: 100, apiScriptTests: 1, apiScriptExecutionsPerMonth: 20, browserTests: 1, browserExecutionsPerMonth: 5, ruUnitPriceMonthly: 80 },
      expectedRows: ['IBM Hosted Public PoP', 'Synthetic RU mensual total', 'Synthetic costo total'],
    },
    {
      name: 'Self-Hosted Logs',
      costs: { costMode: 'detailed', deploymentModel: 'self_hosted', standardMvsQty: 10, standardMonthlyUnitPrice: 100, includeLogsAddon: true, logsManualCostOverride: 2400 },
      expectedRows: ['Self-Hosted / On-Premise', 'Self-Hosted: validar licencia, sizing e infraestructura', 'Logs costo total'],
    },
    {
      name: 'Customer Private PoP',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 10, standardMonthlyUnitPrice: 100, includeSynthetic: true, syntheticExecutionLocation: 'customer_private_pop' },
      expectedRows: ['Customer Private PoP', 'Managed PoP no aplica'],
    },
    {
      name: 'Descuento alto',
      costs: { costMode: 'detailed', deploymentModel: 'saas', standardMvsQty: 10, standardMonthlyUnitPrice: 100, discountPercent: 35 },
      expectedRows: ['Descuento porcentual 35%', 'Descuento alto. Validar proceso comercial.'],
    },
  ];

  for (const scenario of scenarios) {
    it(`valida escenario ${scenario.name}`, () => {
      const model = modelFor(scenario.costs);
      const text = visibleText(model.instanaCostRows);
      if (scenario.expectedAnnual != null) expect(model.results.instanaAnnualCost).toBe(scenario.expectedAnnual);
      for (const expected of scenario.expectedRows) expect(text).toContain(expected);
      expect(text).toContain('Estimacion referencial. No reemplaza cotizacion oficial.');
      expect(text).not.toContain('self_hosted');
      expect(text).not.toContain('ibm_hosted_public_pop');
      expect(text).not.toContain('customer_private_pop');
      expect(text).not.toContain('PS');
    });
  }
});
