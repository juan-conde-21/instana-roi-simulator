import { describe, expect, it } from 'vitest';
import { calculate } from '../calculator';
import { buildReportModel } from '../reportModel';
import { DEFAULT_STATE } from '../../data/defaults';
import type { InstanaCosts } from '../../types';

const modelFor = (instanaCosts: Partial<InstanaCosts>) => {
  const state = { ...DEFAULT_STATE, instanaCosts: { ...DEFAULT_STATE.instanaCosts, ...instanaCosts } };
  return buildReportModel(state, calculate(state));
};

const rowValue = (rows: Array<{ field: string; value: string }>, field: string) => rows.find(r => r.field === field)?.value;

describe('ReportModel pricing', () => {
  it('modo manual contiene costo ingresado y no mezcla lineas detalladas', () => {
    const model = modelFor({
      costMode: 'manual',
      annualLicenseCost: 60000,
      standardMvsQty: 50,
      standardMonthlyUnitPrice: 999,
      includeDataIngestAddon: true,
      dataIngestAddonGb: 500,
    });
    expect(model.results.instanaAnnualCost).toBe(60000);
    expect(rowValue(model.instanaCostRows, 'Fuente del costo')).toBe('Ingresado manualmente');
    expect(rowValue(model.instanaCostRows, 'Costo anual manual')).toBeDefined();
    expect(model.instanaCostRows.some(r => r.field === 'Standard / APM MVS')).toBe(false);
    expect(model.instanaCostRows.some(r => r.field === 'Data Ingest add-on comprado')).toBe(false);
  });

  it('modo detallado contiene desglose base y entradas Standard/Essentials', () => {
    const model = modelFor({
      costMode: 'detailed',
      deploymentModel: 'saas',
      annualLicenseCost: 999999,
      standardMvsQty: 30,
      standardMonthlyUnitPrice: 100,
      standardMonths: 12,
      essentialsMvsQty: 20,
      essentialsMonthlyUnitPrice: 50,
      essentialsMonths: 12,
    });
    expect(model.results.instanaAnnualCost).toBe(48000);
    expect(model.instanaCostModel.standardCost).toBe(36000);
    expect(model.instanaCostModel.essentialsCost).toBe(12000);
    expect(rowValue(model.instanaCostRows, 'Standard / APM MVS')).toBe('30 MVS');
    expect(rowValue(model.instanaCostRows, 'Essentials / IQM MVS')).toBe('20 MVS');
    expect(rowValue(model.instanaCostRows, 'Base total antes de descuento')).toBeDefined();
  });

  it('incluye Data Ingest, Logs y Synthetic con insumos auditables', () => {
    const model = modelFor({
      costMode: 'detailed',
      deploymentModel: 'saas',
      standardMvsQty: 50,
      standardMonthlyUnitPrice: 100,
      standardMonths: 12,
      essentialsMvsQty: 20,
      essentialsMonthlyUnitPrice: 50,
      essentialsMonths: 12,
      includeDataIngestAddon: true,
      expectedMonthlyDataIngestGb: 1000,
      fairUseGbPerStandardMvs: 5,
      fairUseGbPerEssentialsMvs: 2,
      dataIngestAddonGb: 100,
      dataIngestAddonUnitPricePerGb: 1,
      dataIngestOnDemandPricePerGb: 2,
      includeLogsAddon: true,
      logsMonthlyGb: 1500,
      logsRetentionDays: 90,
      logsUnitSizeGb: 1000,
      logsUnitPriceMonthly: 200,
      logsOverageGb: 20,
      logsOverageUnitSizeGb: 10,
      logsOverageUnitPrice: 15,
      includeSynthetic: true,
      simpleApiTests: 1,
      simpleApiExecutionsPerMonth: 100,
      apiScriptTests: 1,
      apiScriptExecutionsPerMonth: 20,
      browserTests: 1,
      browserExecutionsPerMonth: 5,
      ruUnitSize: 1000,
      ruUnitPriceMonthly: 80,
    });
    expect(rowValue(model.instanaCostRows, 'Fair use incluido')).toBe('290 GB');
    expect(rowValue(model.instanaCostRows, 'Data Ingest overage mensual')).toBe('610 GB');
    expect(rowValue(model.instanaCostRows, 'Logs retencion')).toBe('90 dias');
    expect(rowValue(model.instanaCostRows, 'Logs unidades calculadas')).toBe('2');
    expect(rowValue(model.instanaCostRows, 'Synthetic execution location')).toBe('IBM Hosted Public PoP');
    expect(rowValue(model.instanaCostRows, 'Synthetic RU mensual total')).toBe('550 RU');
  });

  it('PDF/Excel reciben el modelo correcto sin enums internos', () => {
    const model = modelFor({
      costMode: 'detailed',
      deploymentModel: 'self_hosted',
      standardMvsQty: 10,
      standardMonthlyUnitPrice: 100,
      includeSynthetic: true,
      syntheticExecutionLocation: 'customer_private_pop',
    });
    expect(model.inputRows.some(r => r.section === 'Costo Instana')).toBe(true);
    const visible = model.instanaCostRows.map(r => `${r.field} ${r.value}`).join(' ');
    expect(visible).not.toContain('self_hosted');
    expect(visible).not.toContain('ibm_hosted_public_pop');
    expect(visible).not.toContain('customer_private_pop');
    expect(visible).not.toContain('PS');
  });
});
