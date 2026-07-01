// ─── Enumeraciones base ──────────────────────────────────────────────────────

export type Industry =
  | 'banking' | 'insurance' | 'retail' | 'telecom' | 'government'
  | 'health' | 'education' | 'manufacturing' | 'tech' | 'other';

export type Currency = 'USD' | 'PEN' | 'EUR' | 'OTHER';

export type Horizon = 12 | 24 | 36;

export type StartingPoint =
  | 'no_apm' | 'basic_monitoring' | 'commercial_apm'
  | 'open_source' | 'multiple_tools' | 'unknown';

export type EvalDriver =
  | 'cost_excessive' | 'unpredictable_consumption' | 'underutilized'
  | 'coverage_limited' | 'war_rooms' | 'high_mttr' | 'fragmented_tools'
  | 'upcoming_renewal' | 'otel_standardization' | 'need_more_coverage' | 'other';

export type AppCount = '1-3' | '4-10' | '11-30' | '31-80' | '80+';

export type AppType =
  | 'web' | 'mobile' | 'api' | 'core_transactional'
  | 'batch' | 'middleware' | 'kubernetes' | 'mixed';

export type Criticality = 'low' | 'medium' | 'high' | 'critical';

export type OperationHours = '8x5' | '12x6' | '24x7';

export type IncidentFrequency = '0-1' | '2-4' | '5-10' | '10+' | 'unknown';

export type DetectionTime =
  | '<10min' | '10-30min' | '30-60min' | '>1h' | 'user_reported' | 'unknown';

export type ResolutionTime =
  | '<30min' | '30min-2h' | '2-6h' | '>6h' | 'unknown';

export type WarRoomDuration =
  | '<1h' | '1-3h' | '3-6h' | '>6h' | 'unknown';

export type WarRoomPeople =
  | '1-3' | '4-8' | '9-15' | '16+' | 'unknown';

export type RootCauseInWarRoom = 'always' | 'sometimes' | 'rarely' | 'unknown';

export type OptionalBlock =
  | 'commercial_apm' | 'open_source' | 'otel' | 'governance'
  | 'fragmentation' | 'migration' | 'slo_sla' | 'security';

export type APMTool =
  | 'dynatrace' | 'newrelic' | 'datadog' | 'appdynamics' | 'elastic' | 'other';

export type CostConcern = 'low' | 'medium' | 'high' | 'critical';

export type ConsumptionPredictability = 'yes' | 'partially' | 'no' | 'unknown';

export type CoverageRestriction =
  | 'no' | 'some_apps_missing' | 'only_critical' | 'avoid_instrumentation' | 'unknown';

export type CoveragePercentage = '0-30' | '31-60' | '61-80' | '81-100' | 'unknown';

export type InfraSize = 'none' | 'small' | 'medium' | 'large' | 'unknown';

export type RetentionPeriod = '7d' | '14d' | '30d' | '60d' | '90d+';

export type UpgradeFrequency = 'monthly' | 'quarterly' | 'biannual' | 'rarely';

export type DependencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type OTelAdoption = 'none' | 'poc' | 'some' | 'majority';

export type LockInConcern = 'low' | 'medium' | 'high';

export type TelemetryVolume = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type CardinalityControl = 'controlled' | 'partial' | 'uncontrolled' | 'unknown';

export type SamplingPolicy = 'yes' | 'partial' | 'no' | 'unknown';

export type ToolCountDuringIncident = '1' | '2-3' | '4-6' | '7+';

export type InstrumentationComplexity = 'low' | 'medium' | 'high';

export type CoexistencePeriod = '1m' | '3m' | '6m' | '12m';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ScenarioType = 'conservative' | 'expected' | 'optimistic';

export type InstanaCostMode = 'manual' | 'detailed';
export type InstanaDeploymentModel = 'saas' | 'self_hosted';
export type InstanaMonthOption = 12 | 24 | 36 | 'custom';
export type SyntheticExecutionLocation = 'ibm_hosted_public_pop' | 'customer_private_pop' | 'self_hosted';

// ─── Capacidades APM ─────────────────────────────────────────────────────────

export interface APMCapabilities {
  apm_tracing: boolean;
  infra_monitoring: boolean;
  kubernetes: boolean;
  logs: boolean;
  synthetic: boolean;
  rum: boolean;
  mobile: boolean;
  smart_alerts: boolean;
  slo_sli: boolean;
  itsm_integration: boolean;
  automation: boolean;
  executive_dashboards: boolean;
  root_cause_analysis: boolean;
}

// ─── Integraciones existentes ─────────────────────────────────────────────────

export interface ExistingIntegrations {
  itsm: boolean;
  slack_teams: boolean;
  ci_cd: boolean;
  cmdb: boolean;
  webhooks: boolean;
}

// ─── Herramientas open source ─────────────────────────────────────────────────

export interface OpenSourceTools {
  prometheus: boolean;
  grafana: boolean;
  elk: boolean;
  loki: boolean;
  jaeger: boolean;
  tempo: boolean;
  otel_collector: boolean;
  zabbix: boolean;
  nagios: boolean;
  victoria_metrics: boolean;
  clickhouse: boolean;
  custom_scripts: boolean;
  other: boolean;
}

// ─── Sección 1: Perfil inicial ────────────────────────────────────────────────

export interface ProfileSection {
  clientName: string;
  industry: Industry;
  currency: Currency;
  customCurrency: string;
  horizon: Horizon;
  startingPoint: StartingPoint;
  evalDriver: EvalDriver;
  evalDriverOther: string;
}

// ─── Sección 2: Alcance y criticidad ─────────────────────────────────────────

export interface ScopeSection {
  appCount: AppCount;
  appType: AppType;
  criticality: Criticality;
  operationHours: OperationHours;
  affectsExternalClients: 'yes' | 'no' | 'unknown';
  processesEconomicTransactions: 'yes' | 'no' | 'unknown';
  hasSlAorRegulatory: 'yes' | 'no' | 'unknown';
}

// ─── Sección 3: Incidentes y war rooms ───────────────────────────────────────

export interface IncidentsSection {
  incidentFrequency: IncidentFrequency;
  detectionTime: DetectionTime;
  resolutionTime: ResolutionTime;
  warRoomDuration: WarRoomDuration;
  warRoomPeople: WarRoomPeople;
  hourlyTeamCost: number | null;
  useEstimatedHourlyCost: boolean;
  rootCauseInWarRoom: RootCauseInWarRoom;
}

// ─── Sección 4: Bloques opcionales ───────────────────────────────────────────

export interface BlocksSection {
  activeBlocks: OptionalBlock[];
}

// ─── Bloque APM comercial ─────────────────────────────────────────────────────

export interface APMBlock {
  tool: APMTool;
  toolOther: string;
  annualCost: number | null;
  projectedRenewalCost: number | null;
  costConcern: CostConcern;
  consumptionPredictable: ConsumptionPredictability;
  costLimitsCoverage: CoverageRestriction;
  criticalAppsCoverage: CoveragePercentage;
  capabilitiesUsed: APMCapabilities;
  capabilitiesAvailableUnused: APMCapabilities;
  activeUsers: number | null;
  teamsUsing: number | null;
  adminPeople: number | null;
  adminMonthlyHours: number | null;
}

// ─── Bloque open source ───────────────────────────────────────────────────────

export interface OpenSourceBlock {
  tools: OpenSourceTools;
  infraSize: InfraSize;
  monthlyInfraCost: number | null;
  monthlyStorage: number | null;
  retention: RetentionPeriod;
  adminPeople: number | null;
  maintenanceHoursMonthly: number | null;
  upgradeFrequency: UpgradeFrequency;
  specialistDependency: DependencyLevel;
  formalSupport: 'yes' | 'no' | 'partial';
  internalDocs: 'updated' | 'partial' | 'none';
}

// ─── Bloque OpenTelemetry ─────────────────────────────────────────────────────

export interface OTelBlock {
  adoptionLevel: OTelAdoption;
  usesCollector: 'yes' | 'no' | 'unknown';
  hasStandardInstrumentation: 'yes' | 'partial' | 'no';
  wantsToAvoidLockIn: LockInConcern;
  needsMultiBackend: 'yes' | 'no' | 'possible';
  hasInternalStandards: 'yes' | 'partial' | 'no';
}

// ─── Bloque gobierno de telemetría ────────────────────────────────────────────

export interface GovernanceBlock {
  logsVolume: TelemetryVolume;
  tracesVolume: TelemetryVolume;
  metricsVolume: TelemetryVolume;
  cardinalityControl: CardinalityControl;
  retentionDefined: 'yes' | 'partial' | 'no';
  hasDuplicateData: 'yes' | 'no' | 'unknown';
  appliesSampling: SamplingPolicy;
}

// ─── Bloque fragmentación ─────────────────────────────────────────────────────

export interface FragmentationBlock {
  toolsPerIncident: ToolCountDuringIncident;
  hasSingleServiceView: 'yes' | 'partial' | 'no';
  hasAutoCorrelation: 'yes' | 'partial' | 'no';
  alertsFromMultipleSources: 'yes' | 'no' | 'unknown';
  duplicatedDashboards: 'yes' | 'no' | 'unknown';
  cmdbUpToDate: 'yes' | 'partial' | 'no';
}

// ─── Bloque migración / coexistencia ──────────────────────────────────────────

export interface MigrationBlock {
  appsToMigrate: number | null;
  instrumentationComplexity: InstrumentationComplexity;
  dashboardDependency: DependencyLevel;
  alertsDependency: DependencyLevel;
  existingIntegrations: ExistingIntegrations;
  coexistencePeriod: CoexistencePeriod;
  hasDoubleCost: 'yes' | 'no' | 'unknown';
}

// ─── Bloque SLO/SLA ──────────────────────────────────────────────────────────

export interface SLOBlock {
  hasSlosDefined: 'yes' | 'partial' | 'no';
  hasContractualSla: 'yes' | 'no' | 'unknown';
  measuresLatency: 'yes' | 'partial' | 'no';
  measuresUserExperience: 'yes' | 'partial' | 'no';
  hasSyntheticMonitoring: 'yes' | 'no' | 'unknown';
  hasRumOrMobile: 'yes' | 'no' | 'unknown';
}

// ─── Bloque seguridad / compliance ────────────────────────────────────────────

export interface SecurityBlock {
  hasDataResidencyRequirements: 'yes' | 'no' | 'unknown';
  hasComplianceRequirements: 'yes' | 'no' | 'unknown';
  requiresOnPrem: 'yes' | 'no' | 'unknown';
  currentToolMeetsCompliance: 'yes' | 'partial' | 'no' | 'unknown';
}

// ─── Costos Instana ───────────────────────────────────────────────────────────

export interface InstanaCosts {
  annualLicenseCost: number | null;
  implementationCost: number | null;
  trainingCost: number | null;
  professionalServicesCost: number | null;
  internalOperationCost: number | null;
  logsCost: number | null;
  syntheticCost: number | null;
  additionalComponentsCost: number | null;
  adoptionPeriodMonths: number;
  costMode: InstanaCostMode;
  deploymentModel: InstanaDeploymentModel;
  monthOption: InstanaMonthOption;
  customMonths: number | null;
  standardMvsQty: number | null;
  standardMonthlyUnitPrice: number | null;
  standardMonths: number | null;
  essentialsMvsQty: number | null;
  essentialsMonthlyUnitPrice: number | null;
  essentialsMonths: number | null;
  minimumMvsPerPartNumber: number;
  enforceServerlessOtelMinimum: boolean;
  serverlessOtelMinimumMvs: number;
  discountPercent: number | null;
  discountReason: string;
  includeDataIngestAddon: boolean;
  expectedMonthlyDataIngestGb: number | null;
  includedFairUseGb: number | null;
  calculateIncludedFairUseAutomatically: boolean;
  fairUseGbPerStandardMvs: number;
  fairUseGbPerEssentialsMvs: number;
  dataIngestAddonGb: number | null;
  dataIngestAddonUnitPricePerGb: number | null;
  dataIngestOnDemandOverageGb: number | null;
  dataIngestOnDemandPricePerGb: number | null;
  includeLogsAddon: boolean;
  logsMonthlyGb: number | null;
  logsRetentionDays: 30 | 60 | 90;
  logsPurchasedUnitsGb: number | null;
  logsUnitSizeGb: number;
  logsUnitPriceMonthly: number | null;
  logsOverageGb: number | null;
  logsOverageUnitSizeGb: number;
  logsOverageUnitPrice: number | null;
  logsManualCostOverride: number | null;
  includeSynthetic: boolean;
  syntheticExecutionLocation: SyntheticExecutionLocation;
  simpleApiTests: number | null;
  simpleApiExecutionsPerMonth: number | null;
  apiScriptTests: number | null;
  apiScriptExecutionsPerMonth: number | null;
  browserTests: number | null;
  browserExecutionsPerMonth: number | null;
  ruPerSimpleApiExecution: number;
  ruPerApiScriptExecution: number;
  ruPerBrowserExecution: number;
  ruUnitSize: number;
  ruUnitPriceMonthly: number | null;
  minimumRuUnitsMonthly: number;
  syntheticManualCostOverride: number | null;
  coexistenceTransitionCost: number | null;
}

export interface InstanaCostBreakdown {
  mode: InstanaCostMode;
  deploymentModel: InstanaDeploymentModel;
  months: number;
  standardCost: number;
  essentialsCost: number;
  baseCost: number;
  discountAmount: number;
  discountedBaseCost: number;
  dataIngestCost: number;
  dataIngestAddonMonthlyCost: number;
  dataIngestOverageMonthlyCost: number;
  logsCost: number;
  logsMonthlyCost: number;
  logsOverageCost: number;
  logsOverageUnits: number;
  syntheticCost: number;
  syntheticMonthlyCost: number;
  simpleApiRuMonthly: number;
  apiScriptRuMonthly: number;
  browserRuMonthly: number;
  servicesCost: number;
  implementationCost: number;
  trainingCost: number;
  operationCost: number;
  professionalServicesCost: number;
  coexistenceTransitionCost: number;
  totalMonthly: number;
  totalAnnual: number;
  totalHorizon: number;
  annualEquivalent: number;
  includedFairUseGb: number;
  monthlyDataIngestOverageGb: number;
  logsUnits: number;
  syntheticRuMonthly: number;
  syntheticPurchasedRuUnits: number;
  warnings: string[];
  assumptions: string[];
}

// ─── Supuestos de escenarios ──────────────────────────────────────────────────

export interface ScenarioAssumptions {
  mttrReduction: [number, number];
  mttdReduction: [number, number];
  warRoomReduction: [number, number];
  adminReduction: [number, number];
  coverageImprovement: [number, number];
  fragmentationReduction: [number, number];
}

export interface ScenariosConfig {
  conservative: ScenarioAssumptions;
  expected: ScenarioAssumptions;
  optimistic: ScenarioAssumptions;
}

// ─── Estado global de la simulación ──────────────────────────────────────────

export interface SimulationState {
  profile: ProfileSection;
  scope: ScopeSection;
  incidents: IncidentsSection;
  blocks: BlocksSection;
  apmBlock: APMBlock;
  openSourceBlock: OpenSourceBlock;
  otelBlock: OTelBlock;
  governanceBlock: GovernanceBlock;
  fragmentationBlock: FragmentationBlock;
  migrationBlock: MigrationBlock;
  sloBlock: SLOBlock;
  securityBlock: SecurityBlock;
  instanaCosts: InstanaCosts;
  scenariosConfig: ScenariosConfig;
}

// ─── Resultados del motor de cálculo ─────────────────────────────────────────

export interface WarRoomMetrics {
  monthlyManHours: number;
  monthlyCost: number;
  annualCost: number;
  hourlyTeamCostUsed: number;
}

export interface ScenarioResult {
  scenario: ScenarioType;
  warRoomSavings: number;
  adminSavings: number;
  infraSavings: number;
  apmRationalizationSavings: number;
  coverageValue: number;
  fragmentationSavings: number;
  telemetrySavings: number;
  totalAnnualBenefit: number;
  totalAnnualCostInstana: number;
  netAnnualBenefit: number;
  roi: number;
  paybackMonths: number;
  tco12: number;
  tco24: number;
  tco36: number;
  tcoCurrentYear1: number;
  tcoCurrentYear2: number;
  tcoCurrentYear3: number;
}

export interface Scores {
  costPressure: number;
  apmUtilization: number;
  coverageRestriction: number;
  operationalDrag: number;
  telemetryWaste: number;
  fragmentation: number;
  otelReadiness: number;
  migrationEffort: number;
  adoptionReadiness: number;
  roiConfidence: number;
}

export interface ROITypes {
  adoption: boolean;
  operationalEfficiency: boolean;
  warRoomReduction: boolean;
  mttrMttdReduction: boolean;
  apmCostOptimization: boolean;
  openSourceTcoReduction: boolean;
  toolConsolidation: boolean;
  coverageExpansion: boolean;
  telemetryControl: boolean;
  operationalRiskReduction: boolean;
  toolTransition: boolean;
  otelStandardization: boolean;
}

export interface CalculationResults {
  warRoom: WarRoomMetrics;
  scenarios: {
    conservative: ScenarioResult;
    expected: ScenarioResult;
    optimistic: ScenarioResult;
  };
  scores: Scores;
  roiTypes: ROITypes;
  confidenceLevel: ConfidenceLevel;
  confidenceScore: number;
  currentAnnualCost: number;
  instanaAnnualCost: number;
  dataCompleteness: number;
}

// ─── Interpretación del resultado ROI ────────────────────────────────────────

export type ROIStatus =
  | 'positive'
  | 'negative_valid'
  | 'negative_insufficient_data'
  | 'negative_transition'
  | 'requires_review';

export type ROIDriverSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ROIDriverCategory = 'cost' | 'benefit' | 'data' | 'transition' | 'context';

export interface ROIDriver {
  id: string;
  label: string;
  description: string;
  severity: ROIDriverSeverity;
  category: ROIDriverCategory;
  value?: string;
}

export interface ROIScenarioComparison {
  conservativeROI: number;
  expectedROI: number;
  optimisticROI: number;
  conservativePositive: boolean;
  expectedPositive: boolean;
  optimisticPositive: boolean;
  positiveCount: number;
}

export interface ROIInterpretation {
  status: ROIStatus;
  badgeLabel: string;
  headline: string;
  context: string;
  scenarioComparison: ROIScenarioComparison;
  drivers: ROIDriver[];
  validationSuggestions: string[];
  improvementActions: string[];
  isExpectedNegative: boolean;
  isAllNegative: boolean;
  narrativeSummary: string;
}

// ─── Validación de escenario ──────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
  canCalculateROI: boolean;
}
