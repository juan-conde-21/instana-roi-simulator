import type { GovernanceBlock } from '../../types';
import { ToggleGroup } from '../UI/FormField';

interface Props { data: GovernanceBlock; onChange: (d: GovernanceBlock) => void }

const VOL_OPTS = [
  { value: 'low', label: 'Bajo' },
  { value: 'medium', label: 'Medio' },
  { value: 'high', label: 'Alto' },
  { value: 'critical', label: 'Crítico' },
  { value: 'unknown', label: 'No sabe' },
];

export default function GovernanceBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof GovernanceBlock>(key: K, val: GovernanceBlock[K]) =>
    onChange({ ...data, [key]: val });

  return (
    <div>
      <div className="grid-2" style={{ gap: 16 }}>
        <ToggleGroup label="Volumen de logs" value={data.logsVolume} onChange={v => set('logsVolume', v as GovernanceBlock['logsVolume'])} options={VOL_OPTS} />
        <ToggleGroup label="Volumen de trazas" value={data.tracesVolume} onChange={v => set('tracesVolume', v as GovernanceBlock['tracesVolume'])} options={VOL_OPTS} />
        <ToggleGroup label="Volumen de métricas" value={data.metricsVolume} onChange={v => set('metricsVolume', v as GovernanceBlock['metricsVolume'])} options={VOL_OPTS} />
        <ToggleGroup
          label="Control de cardinalidad"
          value={data.cardinalityControl}
          onChange={v => set('cardinalityControl', v as GovernanceBlock['cardinalityControl'])}
          options={[
            { value: 'controlled', label: 'Controlado' },
            { value: 'partial', label: 'Parcial' },
            { value: 'uncontrolled', label: 'No controlado' },
            { value: 'unknown', label: 'No sabe' },
          ]}
        />
        <ToggleGroup
          label="Retención definida"
          value={data.retentionDefined}
          onChange={v => set('retentionDefined', v as GovernanceBlock['retentionDefined'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'partial', label: 'Parcial' },
            { value: 'no', label: 'No' },
          ]}
        />
        <ToggleGroup
          label="¿Existen datos duplicados entre herramientas?"
          value={data.hasDuplicateData}
          onChange={v => set('hasDuplicateData', v as GovernanceBlock['hasDuplicateData'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'no', label: 'No' },
            { value: 'unknown', label: 'No sabe' },
          ]}
        />
        <ToggleGroup
          label="¿Se aplican políticas de sampling?"
          value={data.appliesSampling}
          onChange={v => set('appliesSampling', v as GovernanceBlock['appliesSampling'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'partial', label: 'Parcial' },
            { value: 'no', label: 'No' },
            { value: 'unknown', label: 'No sabe' },
          ]}
        />
      </div>
    </div>
  );
}
