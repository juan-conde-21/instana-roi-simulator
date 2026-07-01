import type { InstanaCosts } from '../types';

/**
 * Valores sample/demo para estimaciones referenciales.
 * No son precios oficiales ni deben interpretarse como cotizacion IBM.
 * El usuario puede editarlos desde la UI antes de generar ROI, PDF o Excel.
 */
export const SAMPLE_INSTANA_PRICING_CONFIG: Partial<InstanaCosts> = {
  minimumMvsPerPartNumber: 10,
  serverlessOtelMinimumMvs: 50,
  fairUseGbPerStandardMvs: 0,
  fairUseGbPerEssentialsMvs: 0,
  logsUnitSizeGb: 1000,
  logsOverageUnitSizeGb: 10,
  ruPerSimpleApiExecution: 1,
  ruPerApiScriptExecution: 10,
  ruPerBrowserExecution: 50,
  ruUnitSize: 1000,
  minimumRuUnitsMonthly: 0,
};

export const PRICING_REFERENCE_NOTE = 'Estimacion referencial. No reemplaza cotizacion oficial.';
