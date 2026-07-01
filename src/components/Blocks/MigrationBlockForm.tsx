import type { MigrationBlock } from '../../types';
import { ToggleGroup, NumberField } from '../UI/FormField';
import { CheckboxGroup } from '../UI/FormField';

interface Props { data: MigrationBlock; onChange: (d: MigrationBlock) => void }

export default function MigrationBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof MigrationBlock>(key: K, val: MigrationBlock[K]) =>
    onChange({ ...data, [key]: val });

  const depOpts = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
  ];

  return (
    <div>
      <div className="grid-2" style={{ gap: 16 }}>
        <NumberField
          label="Cantidad de aplicaciones a migrar"
          value={data.appsToMigrate}
          onChange={v => set('appsToMigrate', v)}
        />
        <ToggleGroup
          label="Complejidad de instrumentación"
          value={data.instrumentationComplexity}
          onChange={v => set('instrumentationComplexity', v as MigrationBlock['instrumentationComplexity'])}
          options={depOpts}
        />
        <ToggleGroup
          label="Dependencia de dashboards actuales"
          value={data.dashboardDependency}
          onChange={v => set('dashboardDependency', v as MigrationBlock['dashboardDependency'])}
          options={depOpts}
        />
        <ToggleGroup
          label="Dependencia de alertas actuales"
          value={data.alertsDependency}
          onChange={v => set('alertsDependency', v as MigrationBlock['alertsDependency'])}
          options={depOpts}
        />
        <ToggleGroup
          label="Período de coexistencia estimado"
          value={data.coexistencePeriod}
          onChange={v => set('coexistencePeriod', v as MigrationBlock['coexistencePeriod'])}
          options={[
            { value: '1m', label: '1 mes' },
            { value: '3m', label: '3 meses' },
            { value: '6m', label: '6 meses' },
            { value: '12m', label: '12 meses' },
          ]}
        />
        <ToggleGroup
          label="¿Habrá doble costo temporal?"
          value={data.hasDoubleCost}
          onChange={v => set('hasDoubleCost', v as MigrationBlock['hasDoubleCost'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'no', label: 'No' },
            { value: 'unknown', label: 'No sabe' },
          ]}
        />
      </div>

      <CheckboxGroup
        label="Integraciones existentes a considerar"
        items={[
          { key: 'itsm', label: 'ITSM (ServiceNow, Jira…)' },
          { key: 'slack_teams', label: 'Slack / Teams' },
          { key: 'ci_cd', label: 'CI/CD pipeline' },
          { key: 'cmdb', label: 'CMDB' },
          { key: 'webhooks', label: 'Webhooks / scripts' },
        ]}
        checked={data.existingIntegrations as unknown as Record<string, boolean>}
        onChange={(key, val) => onChange({ ...data, existingIntegrations: { ...data.existingIntegrations, [key]: val } })}
      />

      {data.hasDoubleCost === 'yes' && (
        <div className="notice notice-warning" style={{ marginTop: 12 }}>
          El doble costo temporal durante la coexistencia se incluirá en el cálculo de payback.
        </div>
      )}
    </div>
  );
}
