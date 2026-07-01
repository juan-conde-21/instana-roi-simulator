// Mapeo de valores internos (enums) a etiquetas legibles en español
// Uso: en UI, PDF y Excel — nunca mostrar valores de enum sin traducir

export const INDUSTRY_LABELS: Record<string, string> = {
  banking: 'Banca y finanzas',
  insurance: 'Seguros',
  retail: 'Retail y consumo',
  telecom: 'Telecomunicaciones',
  government: 'Gobierno y sector público',
  health: 'Salud',
  education: 'Educación',
  manufacturing: 'Manufactura e industria',
  tech: 'Tecnología',
  other: 'Otro sector',
};

export const STARTING_POINT_LABELS: Record<string, string> = {
  no_apm: 'Sin APM — primera adopción',
  basic_monitoring: 'Monitoreo básico (infraestructura)',
  commercial_apm: 'APM comercial activo',
  open_source: 'Stack open source / OSS',
  multiple_tools: 'Múltiples herramientas fragmentadas',
  unknown: 'No definido',
};

export const EVAL_DRIVER_LABELS: Record<string, string> = {
  cost_excessive: 'Costo excesivo del APM actual',
  unpredictable_consumption: 'Consumo impredecible o sin control',
  underutilized: 'APM actual subutilizado',
  coverage_limited: 'Cobertura de aplicaciones limitada',
  war_rooms: 'Alta frecuencia de war rooms',
  high_mttr: 'Alto MTTR / MTTD',
  fragmented_tools: 'Herramientas de observabilidad fragmentadas',
  upcoming_renewal: 'Renovación de contrato APM próxima',
  otel_standardization: 'Estandarización OpenTelemetry',
  need_more_coverage: 'Necesidad de mayor cobertura',
  other: 'Otro motivador',
};

export const CRITICALITY_LABELS: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica',
};

export const APP_COUNT_LABELS: Record<string, string> = {
  '1-3': '1 a 3 aplicaciones',
  '4-10': '4 a 10 aplicaciones',
  '11-30': '11 a 30 aplicaciones',
  '31-80': '31 a 80 aplicaciones',
  '80+': 'Más de 80 aplicaciones',
};

export const APP_TYPE_LABELS: Record<string, string> = {
  web: 'Web / portales',
  mobile: 'Mobile',
  api: 'APIs y microservicios',
  core_transactional: 'Core transaccional',
  batch: 'Procesos batch',
  middleware: 'Middleware / mensajería',
  kubernetes: 'Kubernetes / contenedores',
  mixed: 'Tipos mixtos',
};

export const OPERATION_HOURS_LABELS: Record<string, string> = {
  '8x5': '8 horas × 5 días (horario laboral)',
  '12x6': '12 horas × 6 días (ampliado)',
  '24x7': '24×7 — misión crítica continua',
};

export const INCIDENT_FREQUENCY_LABELS: Record<string, string> = {
  '0-1': 'Menos de 1 incidente por mes',
  '2-4': '2 a 4 incidentes por mes',
  '5-10': '5 a 10 incidentes por mes',
  '10+': 'Más de 10 incidentes por mes',
  unknown: 'Frecuencia no definida',
};

export const WAR_ROOM_DURATION_LABELS: Record<string, string> = {
  '<1h': 'Menos de 1 hora',
  '1-3h': '1 a 3 horas',
  '3-6h': '3 a 6 horas',
  '>6h': 'Más de 6 horas',
  unknown: 'Duración no definida',
};

export const WAR_ROOM_PEOPLE_LABELS: Record<string, string> = {
  '1-3': '1 a 3 personas',
  '4-8': '4 a 8 personas',
  '9-15': '9 a 15 personas',
  '16+': '16 o más personas',
  unknown: 'Cantidad no definida',
};

export const APM_TOOL_LABELS: Record<string, string> = {
  dynatrace: 'Dynatrace',
  newrelic: 'New Relic',
  datadog: 'Datadog',
  appdynamics: 'AppDynamics (Cisco)',
  elastic: 'Elastic Observability',
  other: 'Otro APM comercial',
};

export const CURRENCY_LABELS: Record<string, string> = {
  USD: 'USD — Dólares americanos',
  PEN: 'PEN — Soles peruanos',
  EUR: 'EUR — Euros',
  OTHER: 'Moneda personalizada',
};

export const HORIZON_LABELS: Record<string, string> = {
  '12': '12 meses — 1 año',
  '24': '24 meses — 2 años',
  '36': '36 meses — 3 años',
};

export const COEXISTENCE_PERIOD_LABELS: Record<string, string> = {
  '1m': '1 mes',
  '3m': '3 meses',
  '6m': '6 meses',
  '12m': '12 meses (coexistencia extendida)',
};

export const ROI_TYPE_LABELS: Record<string, string> = {
  adoption: 'Adopción de observabilidad',
  operationalEfficiency: 'Eficiencia operativa',
  warRoomReduction: 'Reducción de war rooms',
  mttrMttdReduction: 'Reducción de MTTR y MTTD',
  apmCostOptimization: 'Optimización del costo APM',
  openSourceTcoReduction: 'Reducción del TCO de open source',
  toolConsolidation: 'Consolidación de herramientas',
  coverageExpansion: 'Ampliación de cobertura',
  telemetryControl: 'Control de telemetría',
  operationalRiskReduction: 'Reducción de riesgo operativo',
  toolTransition: 'Transición de herramienta APM',
  otelStandardization: 'Estandarización OpenTelemetry',
};

export const DETECTION_TIME_LABELS: Record<string, string> = {
  '<10min': 'Menos de 10 minutos',
  '10-30min': '10 a 30 minutos',
  '30-60min': '30 a 60 minutos',
  '>1h': 'Más de 1 hora',
  'user_reported': 'Reportado por usuarios',
  'unknown': 'No definido',
};

export const RESOLUTION_TIME_LABELS: Record<string, string> = {
  '<30min': 'Menos de 30 minutos',
  '30min-2h': '30 minutos a 2 horas',
  '2-6h': '2 a 6 horas',
  '>6h': 'Más de 6 horas',
  'unknown': 'No definido',
};

export const COVERAGE_PERCENTAGE_LABELS: Record<string, string> = {
  '0-30': '0 % a 30 % de aplicaciones cubiertas',
  '31-60': '31 % a 60 % de aplicaciones cubiertas',
  '61-80': '61 % a 80 % de aplicaciones cubiertas',
  '81-100': '81 % a 100 % de aplicaciones cubiertas',
  'unknown': 'Cobertura no definida',
};

export const COST_CONCERN_LABELS: Record<string, string> = {
  low: 'Baja preocupación',
  medium: 'Preocupación media',
  high: 'Alta preocupación',
  critical: 'Preocupación crítica',
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'Alto — mayoría de datos son reales',
  medium: 'Medio — mezcla de datos reales y estimados',
  low: 'Bajo — mayoría son estimaciones del sector',
};

export const CONFIDENCE_SHORT: Record<string, string> = {
  high: 'Alto', medium: 'Medio', low: 'Bajo',
};

// Scores — etiquetas únicas para UI, PDF y Excel
export const SCORE_LABELS: Record<string, string> = {
  costPressure: 'Presión de costo APM',
  apmUtilization: 'Aprovechamiento APM',
  coverageRestriction: 'Restricción de cobertura',
  operationalDrag: 'Drag operativo',
  telemetryWaste: 'Desperdicio de telemetría',
  fragmentation: 'Fragmentación de herramientas',
  otelReadiness: 'OTel Readiness',
  migrationEffort: 'Esfuerzo de migración',
  adoptionReadiness: 'Readiness de adopción',
  roiConfidence: 'Confianza del ROI',
};

// Interpretación de valor de score
export function scoreInterpretation(key: string, value: number): string {
  switch (key) {
    case 'costPressure': return value > 60 ? '⚠ Alta presión' : value > 30 ? 'Presión media' : '✓ Presión baja';
    case 'apmUtilization': return value > 70 ? '✓ Buen aprovechamiento' : value > 30 ? 'Aprovechamiento parcial' : '⚠ Subutilizado';
    case 'coverageRestriction': return value > 50 ? '⚠ Cobertura muy limitada' : value > 20 ? 'Cobertura parcial' : '✓ Cobertura aceptable';
    case 'operationalDrag': return value > 50 ? '⚠ Drag elevado' : value > 20 ? 'Drag moderado' : '✓ Operación fluida';
    case 'telemetryWaste': return value > 50 ? '⚠ Desperdicio significativo' : value > 20 ? 'Desperdicio moderado' : '✓ Telemetría controlada';
    case 'fragmentation': return value > 60 ? '⚠ Alta fragmentación' : value > 25 ? 'Fragmentación media' : '✓ Fragmentación baja';
    case 'otelReadiness': return value > 60 ? '✓ Buena adopción OTel' : value > 25 ? 'Adopción parcial' : '⚠ Adopción incipiente';
    case 'migrationEffort': return value > 60 ? '⚠ Migración compleja' : value > 30 ? 'Esfuerzo moderado' : '✓ Migración manejable';
    case 'adoptionReadiness': return value > 60 ? '✓ Listo para adoptar' : value > 30 ? 'Preparación media' : '⚠ Requiere preparación';
    case 'roiConfidence': return value > 65 ? '✓ Confianza alta' : value > 35 ? 'Confianza media' : '⚠ Confianza baja';
    default: return value > 60 ? 'Alto' : value > 30 ? 'Medio' : 'Bajo';
  }
}

export function label(map: Record<string, string>, key: string, fallback?: string): string {
  return map[key] ?? fallback ?? key;
}
