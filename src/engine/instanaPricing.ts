import type { InstanaCostBreakdown, InstanaCosts } from '../types';
import { PRICING_REFERENCE_NOTE } from '../data/pricingConfig';

const n = (value: number | null | undefined): number => Math.max(0, Number(value) || 0);
const ceilDiv = (value: number, unit: number): number => unit > 0 ? Math.ceil(value / unit) : 0;

export function resolveInstanaPricingMonths(costs: InstanaCosts, fallbackMonths: number): number {
  if (costs.monthOption === 'custom') return Math.max(1, n(costs.customMonths) || fallbackMonths || 12);
  return typeof costs.monthOption === 'number' ? costs.monthOption : Math.max(1, fallbackMonths || 12);
}

export function calculateInstanaCostBreakdown(costs: InstanaCosts, fallbackMonths = 12): InstanaCostBreakdown {
  const mode = costs.costMode ?? 'manual';
  const deploymentModel = costs.deploymentModel ?? 'saas';
  const months = resolveInstanaPricingMonths(costs, fallbackMonths);
  const discountPercent = Math.min(100, Math.max(0, n(costs.discountPercent)));
  const warnings: string[] = [PRICING_REFERENCE_NOTE];
  const assumptions: string[] = [
    'Alcance exclusivo: Instana Distributed. No incluye z/OS, mainframe, MSU, VU ni Workload Pricer.',
    'Los valores unitarios son referenciales y deben validarse con una cotizacion oficial.',
  ];

  if (mode === 'manual') {
    const annual = n(costs.annualLicenseCost);
    const operationCost = n(costs.internalOperationCost);
    const implementationCost = n(costs.implementationCost);
    const trainingCost = n(costs.trainingCost);
    const professionalServicesCost = n(costs.professionalServicesCost);
    const servicesCost = implementationCost + trainingCost + professionalServicesCost;
    const addonAnnual = n(costs.logsCost) + n(costs.syntheticCost) + n(costs.additionalComponentsCost);
    const totalAnnual = annual + operationCost + addonAnnual + (servicesCost / Math.max(1, months / 12));
    if (totalAnnual === 0) warnings.push('Debe ingresar costo manual o calcular costo referencial.');
    return {
      mode, deploymentModel, months,
      standardCost: annual, essentialsCost: 0, baseCost: annual,
      discountAmount: 0, discountedBaseCost: annual,
      dataIngestCost: n(costs.additionalComponentsCost),
      dataIngestAddonMonthlyCost: n(costs.additionalComponentsCost) / 12,
      dataIngestOverageMonthlyCost: 0,
      logsCost: n(costs.logsCost),
      logsMonthlyCost: n(costs.logsCost) / 12,
      logsOverageCost: 0,
      logsOverageUnits: 0,
      syntheticCost: n(costs.syntheticCost),
      syntheticMonthlyCost: n(costs.syntheticCost) / 12,
      simpleApiRuMonthly: 0,
      apiScriptRuMonthly: 0,
      browserRuMonthly: 0,
      servicesCost, implementationCost, trainingCost, operationCost, professionalServicesCost,
      coexistenceTransitionCost: n(costs.coexistenceTransitionCost),
      totalMonthly: totalAnnual / 12,
      totalAnnual,
      totalHorizon: totalAnnual * (months / 12),
      annualEquivalent: totalAnnual,
      includedFairUseGb: 0,
      monthlyDataIngestOverageGb: 0,
      logsUnits: 0,
      syntheticRuMonthly: 0,
      syntheticPurchasedRuUnits: 0,
      warnings,
      assumptions,
    };
  }

  const standardMonths = Math.max(1, n(costs.standardMonths) || months);
  const essentialsMonths = Math.max(1, n(costs.essentialsMonths) || months);
  const standardCost = n(costs.standardMvsQty) * n(costs.standardMonthlyUnitPrice) * standardMonths;
  const essentialsCost = n(costs.essentialsMvsQty) * n(costs.essentialsMonthlyUnitPrice) * essentialsMonths;
  const baseCost = standardCost + essentialsCost;
  const discountAmount = baseCost * (discountPercent / 100);
  const discountedBaseCost = baseCost - discountAmount;

  const minimum = costs.enforceServerlessOtelMinimum ? n(costs.serverlessOtelMinimumMvs) : n(costs.minimumMvsPerPartNumber);
  if (n(costs.standardMvsQty) > 0 && n(costs.standardMvsQty) < minimum) warnings.push('Cantidad MVS por debajo del minimo referencial. Validar cotizacion.');
  if (n(costs.essentialsMvsQty) > 0 && n(costs.essentialsMvsQty) < minimum) warnings.push('Cantidad MVS por debajo del minimo referencial. Validar cotizacion.');
  if (discountPercent > 30) warnings.push('Descuento alto. Validar proceso comercial.');

  let includedFairUseGb = n(costs.includedFairUseGb);
  if (deploymentModel === 'saas' && costs.calculateIncludedFairUseAutomatically) {
    includedFairUseGb = n(costs.standardMvsQty) * n(costs.fairUseGbPerStandardMvs) +
      n(costs.essentialsMvsQty) * n(costs.fairUseGbPerEssentialsMvs);
  }
  const expectedIngest = n(costs.expectedMonthlyDataIngestGb);
  const ingestAddonGb = costs.includeDataIngestAddon ? n(costs.dataIngestAddonGb) : 0;
  const monthlyDataIngestOverageGb = Math.max(0, expectedIngest - includedFairUseGb - ingestAddonGb);
  const manualOverageGb = n(costs.dataIngestOnDemandOverageGb);
  const chargedOverageGb = manualOverageGb > 0 ? manualOverageGb : monthlyDataIngestOverageGb;
  const dataIngestAddonMonthlyCost = costs.includeDataIngestAddon
    ? ingestAddonGb * n(costs.dataIngestAddonUnitPricePerGb)
    : 0;
  const dataIngestOverageMonthlyCost = costs.includeDataIngestAddon
    ? chargedOverageGb * n(costs.dataIngestOnDemandPricePerGb)
    : 0;
  const dataIngestMonthlyCost = dataIngestAddonMonthlyCost + dataIngestOverageMonthlyCost;
  const dataIngestCost = dataIngestMonthlyCost * months;
  if (expectedIngest > includedFairUseGb) warnings.push('Consumo de data ingest supera fair use estimado.');
  if (costs.includeDataIngestAddon) warnings.push('Evitar doble conteo. Validar si el volumen ingresado corresponde a data ingest general, logs u otro componente de la cotizacion.');

  let logsUnits = 0;
  let logsOverageUnits = 0;
  let logsMonthlyCost = 0;
  let logsOverageCost = 0;
  let logsCost = 0;
  if (costs.includeLogsAddon) {
    if (deploymentModel === 'saas') {
      logsUnits = n(costs.logsPurchasedUnitsGb) > 0 ? n(costs.logsPurchasedUnitsGb) : ceilDiv(n(costs.logsMonthlyGb), n(costs.logsUnitSizeGb));
      logsOverageUnits = ceilDiv(n(costs.logsOverageGb), n(costs.logsOverageUnitSizeGb));
      logsMonthlyCost = logsUnits * n(costs.logsUnitPriceMonthly);
      logsOverageCost = logsOverageUnits * n(costs.logsOverageUnitPrice);
      logsCost = (logsMonthlyCost + logsOverageCost) * months;
    } else {
      logsCost = n(costs.logsManualCostOverride);
      logsMonthlyCost = months > 0 ? logsCost / months : 0;
      warnings.push('Logs add-on SaaS no aplica directamente a Self-Hosted. Revisar configuracion.');
      assumptions.push('Para Self-Hosted, Logs in Context puede tratarse como incluido segun licencia. Validar sizing, infraestructura y habilitacion.');
    }
  }

  let simpleApiRuMonthly = 0;
  let apiScriptRuMonthly = 0;
  let browserRuMonthly = 0;
  let syntheticRuMonthly = 0;
  let syntheticPurchasedRuUnits = 0;
  let syntheticMonthlyCost = 0;
  let syntheticCost = 0;
  const managedPopApplies = costs.includeSynthetic && deploymentModel === 'saas' && costs.syntheticExecutionLocation === 'ibm_hosted_public_pop';
  if (costs.includeSynthetic && managedPopApplies) {
    simpleApiRuMonthly = n(costs.simpleApiTests) * n(costs.simpleApiExecutionsPerMonth) * n(costs.ruPerSimpleApiExecution);
    apiScriptRuMonthly = n(costs.apiScriptTests) * n(costs.apiScriptExecutionsPerMonth) * n(costs.ruPerApiScriptExecution);
    browserRuMonthly = n(costs.browserTests) * n(costs.browserExecutionsPerMonth) * n(costs.ruPerBrowserExecution);
    syntheticRuMonthly = simpleApiRuMonthly + apiScriptRuMonthly + browserRuMonthly;
    syntheticPurchasedRuUnits = Math.max(n(costs.minimumRuUnitsMonthly), ceilDiv(syntheticRuMonthly, n(costs.ruUnitSize)));
    syntheticMonthlyCost = syntheticPurchasedRuUnits * n(costs.ruUnitPriceMonthly);
    syntheticCost = syntheticMonthlyCost * months;
  } else if (costs.includeSynthetic) {
    syntheticCost = n(costs.syntheticManualCostOverride);
    syntheticMonthlyCost = months > 0 ? syntheticCost / months : 0;
    warnings.push('Managed PoP no aplica para este escenario.');
    assumptions.push('No se agrega costo Managed PoP cuando las ejecuciones se realizan desde PoPs propios o Self-Hosted.');
  }

  const implementationCost = n(costs.implementationCost);
  const trainingCost = n(costs.trainingCost);
  const professionalServicesCost = n(costs.professionalServicesCost);
  const servicesCost = implementationCost + trainingCost + professionalServicesCost;
  const operationCost = n(costs.internalOperationCost) * (months / 12);
  const coexistenceTransitionCost = n(costs.coexistenceTransitionCost);
  const totalHorizon = discountedBaseCost + dataIngestCost + logsCost + syntheticCost + servicesCost + operationCost + coexistenceTransitionCost;
  const totalAnnual = totalHorizon / Math.max(1, months / 12);
  if (totalHorizon === 0) warnings.push('Debe ingresar costo manual o calcular costo referencial.');

  return {
    mode, deploymentModel, months,
    standardCost, essentialsCost, baseCost, discountAmount, discountedBaseCost,
    dataIngestCost, dataIngestAddonMonthlyCost, dataIngestOverageMonthlyCost,
    logsCost, logsMonthlyCost, logsOverageCost, logsOverageUnits,
    syntheticCost, syntheticMonthlyCost, simpleApiRuMonthly, apiScriptRuMonthly, browserRuMonthly,
    servicesCost, implementationCost, trainingCost, operationCost, professionalServicesCost,
    coexistenceTransitionCost,
    totalMonthly: totalHorizon / months,
    totalAnnual,
    totalHorizon,
    annualEquivalent: totalAnnual,
    includedFairUseGb,
    monthlyDataIngestOverageGb,
    logsUnits,
    syntheticRuMonthly,
    syntheticPurchasedRuUnits,
    warnings: Array.from(new Set(warnings)),
    assumptions,
  };
}
