import type { APMBlock, APMCapabilities } from '../../types';
import { ToggleGroup, NumberField, SelectField } from '../UI/FormField';
import { CheckboxGroup } from '../UI/FormField';

const CAP_ITEMS = [
  { key: 'apm_tracing', label: 'APM / Tracing' },
  { key: 'infra_monitoring', label: 'Infra monitoring' },
  { key: 'kubernetes', label: 'Kubernetes' },
  { key: 'logs', label: 'Logs' },
  { key: 'synthetic', label: 'Synthetic' },
  { key: 'rum', label: 'RUM' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'smart_alerts', label: 'Alertas inteligentes' },
  { key: 'slo_sli', label: 'SLO / SLI' },
  { key: 'itsm_integration', label: 'Integración ITSM' },
  { key: 'automation', label: 'Automatización' },
  { key: 'executive_dashboards', label: 'Dashboards ejecutivos' },
  { key: 'root_cause_analysis', label: 'Análisis causa raíz' },
];

interface Props { data: APMBlock; onChange: (d: APMBlock) => void }

export default function APMBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof APMBlock>(key: K, val: APMBlock[K]) =>
    onChange({ ...data, [key]: val });

  const setCap = (field: 'capabilitiesUsed' | 'capabilitiesAvailableUnused', key: string, val: boolean) =>
    onChange({ ...data, [field]: { ...data[field], [key]: val } });

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SelectField
          label="Herramienta APM actual"
          value={data.tool}
          onChange={v => set('tool', v as APMBlock['tool'])}
          options={[
            { value: 'dynatrace', label: 'Dynatrace' },
            { value: 'newrelic', label: 'New Relic' },
            { value: 'datadog', label: 'Datadog' },
            { value: 'appdynamics', label: 'AppDynamics (Cisco)' },
            { value: 'elastic', label: 'Elastic Observability' },
            { value: 'other', label: 'Otra' },
          ]}
        />
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div>
          <NumberField
            label="Costo anual actual (licencia)"
            value={data.annualCost}
            onChange={v => set('annualCost', v)}
            placeholder="ej. 280000"
            prefix="$"
          />
          <NumberField
            label="Costo de renovación proyectado"
            value={data.projectedRenewalCost}
            onChange={v => set('projectedRenewalCost', v)}
            placeholder="ej. 320000"
            prefix="$"
            hint="Estimación para el próximo período"
          />
        </div>
        <div>
          <ToggleGroup
            label="¿El costo actual es una preocupación?"
            value={data.costConcern}
            onChange={v => set('costConcern', v as APMBlock['costConcern'])}
            options={[
              { value: 'low', label: 'Bajo' },
              { value: 'medium', label: 'Medio' },
              { value: 'high', label: 'Alto' },
              { value: 'critical', label: 'Crítico' },
            ]}
          />
          <ToggleGroup
            label="¿El consumo es predecible?"
            value={data.consumptionPredictable}
            onChange={v => set('consumptionPredictable', v as APMBlock['consumptionPredictable'])}
            options={[
              { value: 'yes', label: 'Sí' },
              { value: 'partially', label: 'Parcialmente' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'No sabe' },
            ]}
          />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, marginTop: 8 }}>
        <ToggleGroup
          label="¿El costo limita la cobertura?"
          value={data.costLimitsCoverage}
          onChange={v => set('costLimitsCoverage', v as APMBlock['costLimitsCoverage'])}
          options={[
            { value: 'no', label: 'No' },
            { value: 'some_apps_missing', label: 'Algunas apps quedan fuera' },
            { value: 'only_critical', label: 'Solo monitorean lo crítico' },
            { value: 'avoid_instrumentation', label: 'Evitan instrumentar' },
            { value: 'unknown', label: 'No sabe' },
          ]}
        />
        <ToggleGroup
          label="% apps críticas cubiertas"
          value={data.criticalAppsCoverage}
          onChange={v => set('criticalAppsCoverage', v as APMBlock['criticalAppsCoverage'])}
          options={[
            { value: '0-30', label: '0–30%' },
            { value: '31-60', label: '31–60%' },
            { value: '61-80', label: '61–80%' },
            { value: '81-100', label: '81–100%' },
            { value: 'unknown', label: 'No sabe' },
          ]}
        />
      </div>

      <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
        <CheckboxGroup
          label="Capacidades usadas actualmente"
          items={CAP_ITEMS}
          checked={data.capabilitiesUsed as unknown as Record<string, boolean>}
          onChange={(key, val) => setCap('capabilitiesUsed', key, val)}
        />
        <CheckboxGroup
          label="Capacidades disponibles pero poco usadas"
          items={CAP_ITEMS}
          checked={data.capabilitiesAvailableUnused as unknown as Record<string, boolean>}
          onChange={(key, val) => setCap('capabilitiesAvailableUnused', key, val)}
        />
      </div>

      <div className="grid-2" style={{ gap: 16, marginTop: 8 }}>
        <NumberField label="Usuarios activos aproximados" value={data.activeUsers} onChange={v => set('activeUsers', v)} />
        <NumberField label="Equipos que realmente usan la herramienta" value={data.teamsUsing} onChange={v => set('teamsUsing', v)} />
        <NumberField label="Personas que administran la herramienta" value={data.adminPeople} onChange={v => set('adminPeople', v)} />
        <NumberField label="Horas mensuales de administración" value={data.adminMonthlyHours} onChange={v => set('adminMonthlyHours', v)} suffix="h/mes" />
      </div>

      {data.annualCost && data.projectedRenewalCost && data.projectedRenewalCost > data.annualCost && (
        <div className="notice notice-warning" style={{ marginTop: 12 }}>
          El crecimiento proyectado de costo APM es {(((data.projectedRenewalCost - data.annualCost) / data.annualCost) * 100).toFixed(1)}%.
          Esto se incluirá en el análisis de presión de costo.
        </div>
      )}

      <div className="notice notice-info" style={{ marginTop: 12 }}>
        El costo subutilizado no se presenta como ahorro directo automático, sino como "costo potencialmente subutilizado".
        El simulador refleja la diferencia entre capacidades contratadas y capacidades realmente usadas.
      </div>
    </div>
  );
}
