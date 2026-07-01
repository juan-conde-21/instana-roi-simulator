import type { OpenSourceBlock } from '../../types';
import { ToggleGroup, NumberField } from '../UI/FormField';
import { CheckboxGroup } from '../UI/FormField';

const OS_TOOLS = [
  { key: 'prometheus', label: 'Prometheus' },
  { key: 'grafana', label: 'Grafana' },
  { key: 'elk', label: 'ELK / Elastic' },
  { key: 'loki', label: 'Loki' },
  { key: 'jaeger', label: 'Jaeger' },
  { key: 'tempo', label: 'Tempo' },
  { key: 'otel_collector', label: 'OTel Collector' },
  { key: 'zabbix', label: 'Zabbix' },
  { key: 'nagios', label: 'Nagios' },
  { key: 'victoria_metrics', label: 'VictoriaMetrics' },
  { key: 'clickhouse', label: 'ClickHouse' },
  { key: 'custom_scripts', label: 'Scripts propios' },
  { key: 'other', label: 'Otra' },
];

interface Props { data: OpenSourceBlock; onChange: (d: OpenSourceBlock) => void }

export default function OpenSourceBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof OpenSourceBlock>(key: K, val: OpenSourceBlock[K]) =>
    onChange({ ...data, [key]: val });

  const tco = ((data.monthlyInfraCost ?? 0) + (data.adminPeople ?? 0) * (data.maintenanceHoursMonthly ?? 0) * 80) * 12;

  return (
    <div>
      <CheckboxGroup
        label="Herramientas open source usadas"
        items={OS_TOOLS}
        checked={data.tools as unknown as Record<string, boolean>}
        onChange={(key, val) => onChange({ ...data, tools: { ...data.tools, [key]: val } })}
      />

      <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
        <div>
          <ToggleGroup
            label="Infraestructura propia"
            value={data.infraSize}
            onChange={v => set('infraSize', v as OpenSourceBlock['infraSize'])}
            options={[
              { value: 'none', label: 'No' },
              { value: 'small', label: 'Pequeña' },
              { value: 'medium', label: 'Mediana' },
              { value: 'large', label: 'Grande/crítica' },
              { value: 'unknown', label: 'No sabe' },
            ]}
          />
          <NumberField
            label="Costo mensual estimado de infraestructura"
            value={data.monthlyInfraCost}
            onChange={v => set('monthlyInfraCost', v)}
            placeholder="ej. 1500"
            prefix="$"
          />
          <NumberField
            label="Storage mensual aproximado (GB)"
            value={data.monthlyStorage}
            onChange={v => set('monthlyStorage', v)}
            suffix="GB"
          />
          <ToggleGroup
            label="Retención de datos"
            value={data.retention}
            onChange={v => set('retention', v as OpenSourceBlock['retention'])}
            options={[
              { value: '7d', label: '7 días' },
              { value: '14d', label: '14 días' },
              { value: '30d', label: '30 días' },
              { value: '60d', label: '60 días' },
              { value: '90d+', label: '90+ días' },
            ]}
          />
        </div>
        <div>
          <NumberField
            label="Personas que administran la plataforma"
            value={data.adminPeople}
            onChange={v => set('adminPeople', v)}
          />
          <NumberField
            label="Horas mensuales de mantenimiento"
            value={data.maintenanceHoursMonthly}
            onChange={v => set('maintenanceHoursMonthly', v)}
            suffix="h/mes"
          />
          <ToggleGroup
            label="Frecuencia de upgrades"
            value={data.upgradeFrequency}
            onChange={v => set('upgradeFrequency', v as OpenSourceBlock['upgradeFrequency'])}
            options={[
              { value: 'monthly', label: 'Mensual' },
              { value: 'quarterly', label: 'Trimestral' },
              { value: 'biannual', label: 'Semestral' },
              { value: 'rarely', label: 'Casi nunca' },
            ]}
          />
          <ToggleGroup
            label="Nivel de dependencia de especialistas"
            value={data.specialistDependency}
            onChange={v => set('specialistDependency', v as OpenSourceBlock['specialistDependency'])}
            options={[
              { value: 'low', label: 'Bajo' },
              { value: 'medium', label: 'Medio' },
              { value: 'high', label: 'Alto' },
              { value: 'critical', label: 'Crítico' },
            ]}
          />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, marginTop: 8 }}>
        <ToggleGroup
          label="Soporte formal"
          value={data.formalSupport}
          onChange={v => set('formalSupport', v as OpenSourceBlock['formalSupport'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'no', label: 'No' },
            { value: 'partial', label: 'Parcial' },
          ]}
        />
        <ToggleGroup
          label="Documentación interna"
          value={data.internalDocs}
          onChange={v => set('internalDocs', v as OpenSourceBlock['internalDocs'])}
          options={[
            { value: 'updated', label: 'Actualizada' },
            { value: 'partial', label: 'Parcial' },
            { value: 'none', label: 'No existe' },
          ]}
        />
      </div>

      {tco > 0 && (
        <div className="notice notice-info" style={{ marginTop: 12 }}>
          TCO open source estimado: <strong>${(tco / 1000).toFixed(0)}K/año</strong>
          (infraestructura + administración a $80/h estimado).
        </div>
      )}
    </div>
  );
}
