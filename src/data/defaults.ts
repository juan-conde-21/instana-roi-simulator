import type {
  SimulationState, ScenariosConfig, APMCapabilities,
  OpenSourceTools, ExistingIntegrations
} from '../types';

export const DEFAULT_APM_CAPABILITIES: APMCapabilities = {
  apm_tracing: false, infra_monitoring: false, kubernetes: false,
  logs: false, synthetic: false, rum: false, mobile: false,
  smart_alerts: false, slo_sli: false, itsm_integration: false,
  automation: false, executive_dashboards: false, root_cause_analysis: false,
};

export const DEFAULT_OS_TOOLS: OpenSourceTools = {
  prometheus: false, grafana: false, elk: false, loki: false,
  jaeger: false, tempo: false, otel_collector: false, zabbix: false,
  nagios: false, victoria_metrics: false, clickhouse: false,
  custom_scripts: false, other: false,
};

export const DEFAULT_INTEGRATIONS: ExistingIntegrations = {
  itsm: false, slack_teams: false, ci_cd: false, cmdb: false, webhooks: false,
};

export const DEFAULT_SCENARIOS_CONFIG: ScenariosConfig = {
  conservative: {
    mttrReduction: [10, 15],
    mttdReduction: [15, 20],
    warRoomReduction: [15, 20],
    adminReduction: [5, 10],
    coverageImprovement: [10, 10],
    fragmentationReduction: [10, 10],
  },
  expected: {
    mttrReduction: [25, 35],
    mttdReduction: [30, 40],
    warRoomReduction: [30, 40],
    adminReduction: [15, 25],
    coverageImprovement: [25, 30],
    fragmentationReduction: [25, 30],
  },
  optimistic: {
    mttrReduction: [45, 55],
    mttdReduction: [50, 60],
    warRoomReduction: [50, 60],
    adminReduction: [35, 40],
    coverageImprovement: [40, 50],
    fragmentationReduction: [40, 50],
  },
};

export const DEFAULT_STATE: SimulationState = {
  profile: {
    clientName: '',
    industry: 'tech',
    currency: 'USD',
    customCurrency: '',
    horizon: 36,
    startingPoint: 'unknown',
    evalDriver: 'cost_excessive',
    evalDriverOther: '',
  },
  scope: {
    appCount: '4-10',
    appType: 'mixed',
    criticality: 'medium',
    operationHours: '24x7',
    affectsExternalClients: 'unknown',
    processesEconomicTransactions: 'unknown',
    hasSlAorRegulatory: 'unknown',
  },
  incidents: {
    incidentFrequency: '2-4',
    detectionTime: '10-30min',
    resolutionTime: '30min-2h',
    warRoomDuration: '1-3h',
    warRoomPeople: '4-8',
    hourlyTeamCost: null,
    useEstimatedHourlyCost: true,
    rootCauseInWarRoom: 'sometimes',
  },
  blocks: {
    activeBlocks: [],
  },
  apmBlock: {
    tool: 'dynatrace',
    toolOther: '',
    annualCost: null,
    projectedRenewalCost: null,
    costConcern: 'medium',
    consumptionPredictable: 'partially',
    costLimitsCoverage: 'some_apps_missing',
    criticalAppsCoverage: '61-80',
    capabilitiesUsed: { ...DEFAULT_APM_CAPABILITIES },
    capabilitiesAvailableUnused: { ...DEFAULT_APM_CAPABILITIES },
    activeUsers: null,
    teamsUsing: null,
    adminPeople: null,
    adminMonthlyHours: null,
  },
  openSourceBlock: {
    tools: { ...DEFAULT_OS_TOOLS },
    infraSize: 'medium',
    monthlyInfraCost: null,
    monthlyStorage: null,
    retention: '30d',
    adminPeople: null,
    maintenanceHoursMonthly: null,
    upgradeFrequency: 'quarterly',
    specialistDependency: 'medium',
    formalSupport: 'no',
    internalDocs: 'partial',
  },
  otelBlock: {
    adoptionLevel: 'none',
    usesCollector: 'unknown',
    hasStandardInstrumentation: 'no',
    wantsToAvoidLockIn: 'medium',
    needsMultiBackend: 'possible',
    hasInternalStandards: 'no',
  },
  governanceBlock: {
    logsVolume: 'unknown',
    tracesVolume: 'unknown',
    metricsVolume: 'unknown',
    cardinalityControl: 'unknown',
    retentionDefined: 'partial',
    hasDuplicateData: 'unknown',
    appliesSampling: 'unknown',
  },
  fragmentationBlock: {
    toolsPerIncident: '2-3',
    hasSingleServiceView: 'no',
    hasAutoCorrelation: 'no',
    alertsFromMultipleSources: 'yes',
    duplicatedDashboards: 'unknown',
    cmdbUpToDate: 'partial',
  },
  migrationBlock: {
    appsToMigrate: null,
    instrumentationComplexity: 'medium',
    dashboardDependency: 'medium',
    alertsDependency: 'medium',
    existingIntegrations: { ...DEFAULT_INTEGRATIONS },
    coexistencePeriod: '3m',
    hasDoubleCost: 'unknown',
  },
  sloBlock: {
    hasSlosDefined: 'no',
    hasContractualSla: 'unknown',
    measuresLatency: 'no',
    measuresUserExperience: 'no',
    hasSyntheticMonitoring: 'unknown',
    hasRumOrMobile: 'unknown',
  },
  securityBlock: {
    hasDataResidencyRequirements: 'unknown',
    hasComplianceRequirements: 'unknown',
    requiresOnPrem: 'unknown',
    currentToolMeetsCompliance: 'unknown',
  },
  instanaCosts: {
    annualLicenseCost: null,
    implementationCost: null,
    trainingCost: null,
    professionalServicesCost: null,
    internalOperationCost: null,
    logsCost: null,
    syntheticCost: null,
    additionalComponentsCost: null,
    adoptionPeriodMonths: 3,
    costMode: 'manual',
    deploymentModel: 'saas',
    monthOption: 12,
    customMonths: null,
    standardMvsQty: null,
    standardMonthlyUnitPrice: 0,
    standardMonths: 12,
    essentialsMvsQty: null,
    essentialsMonthlyUnitPrice: 0,
    essentialsMonths: 12,
    minimumMvsPerPartNumber: 10,
    enforceServerlessOtelMinimum: false,
    serverlessOtelMinimumMvs: 50,
    discountPercent: 0,
    discountReason: '',
    includeDataIngestAddon: false,
    expectedMonthlyDataIngestGb: null,
    includedFairUseGb: null,
    calculateIncludedFairUseAutomatically: true,
    fairUseGbPerStandardMvs: 0,
    fairUseGbPerEssentialsMvs: 0,
    dataIngestAddonGb: null,
    dataIngestAddonUnitPricePerGb: 0,
    dataIngestOnDemandOverageGb: null,
    dataIngestOnDemandPricePerGb: 0,
    includeLogsAddon: false,
    logsMonthlyGb: null,
    logsRetentionDays: 30,
    logsPurchasedUnitsGb: null,
    logsUnitSizeGb: 1000,
    logsUnitPriceMonthly: 0,
    logsOverageGb: null,
    logsOverageUnitSizeGb: 10,
    logsOverageUnitPrice: 0,
    logsManualCostOverride: null,
    includeSynthetic: false,
    syntheticExecutionLocation: 'ibm_hosted_public_pop',
    simpleApiTests: null,
    simpleApiExecutionsPerMonth: null,
    apiScriptTests: null,
    apiScriptExecutionsPerMonth: null,
    browserTests: null,
    browserExecutionsPerMonth: null,
    ruPerSimpleApiExecution: 1,
    ruPerApiScriptExecution: 10,
    ruPerBrowserExecution: 50,
    ruUnitSize: 1000,
    ruUnitPriceMonthly: 0,
    minimumRuUnitsMonthly: 0,
    syntheticManualCostOverride: null,
    coexistenceTransitionCost: null,
  },
  scenariosConfig: DEFAULT_SCENARIOS_CONFIG,
};

// ─── Valores estimados por industria (por hora, USD) ─────────────────────────

export const INDUSTRY_HOURLY_COSTS: Record<string, number> = {
  banking: 120, insurance: 110, retail: 70, telecom: 90, government: 65,
  health: 85, education: 55, manufacturing: 75, tech: 100, other: 80,
};

// ─── Factores de criticidad en costo de incidentes ────────────────────────────

export const CRITICALITY_MULTIPLIERS: Record<string, number> = {
  low: 0.5, medium: 1.0, high: 1.5, critical: 2.5,
};

// ─── Frecuencia de incidentes → número mensual promedio ──────────────────────

export const INCIDENT_FREQUENCY_MAP: Record<string, number> = {
  '0-1': 0.5, '2-4': 3, '5-10': 7.5, '10+': 12, unknown: 3,
};

// ─── Duración de war room → horas ─────────────────────────────────────────────

export const WAR_ROOM_DURATION_MAP: Record<string, number> = {
  '<1h': 0.75, '1-3h': 2, '3-6h': 4.5, '>6h': 8, unknown: 2,
};

// ─── Personas en war room → número ────────────────────────────────────────────

export const WAR_ROOM_PEOPLE_MAP: Record<string, number> = {
  '1-3': 2, '4-8': 6, '9-15': 12, '16+': 20, unknown: 6,
};

// ─── Moneda → símbolo ──────────────────────────────────────────────────────────

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', PEN: 'S/', EUR: '€', OTHER: '',
};
