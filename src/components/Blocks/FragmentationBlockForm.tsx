import type { FragmentationBlock } from '../../types';
import { ToggleGroup } from '../UI/FormField';

interface Props { data: FragmentationBlock; onChange: (d: FragmentationBlock) => void }

export default function FragmentationBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof FragmentationBlock>(key: K, val: FragmentationBlock[K]) =>
    onChange({ ...data, [key]: val });

  const yesNoUnknown = [
    { value: 'yes', label: 'Sí' },
    { value: 'no', label: 'No' },
    { value: 'unknown', label: 'No sabe' },
  ];

  return (
    <div>
      <div className="grid-2" style={{ gap: 16 }}>
        <ToggleGroup
          label="Herramientas usadas durante un incidente"
          value={data.toolsPerIncident}
          onChange={v => set('toolsPerIncident', v as FragmentationBlock['toolsPerIncident'])}
          options={[
            { value: '1', label: '1' },
            { value: '2-3', label: '2–3' },
            { value: '4-6', label: '4–6' },
            { value: '7+', label: '7+' },
          ]}
        />
        <ToggleGroup
          label="¿Existe una vista única del servicio?"
          value={data.hasSingleServiceView}
          onChange={v => set('hasSingleServiceView', v as FragmentationBlock['hasSingleServiceView'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'partial', label: 'Parcial' },
            { value: 'no', label: 'No' },
          ]}
        />
        <ToggleGroup
          label="¿Hay correlación automática?"
          value={data.hasAutoCorrelation}
          onChange={v => set('hasAutoCorrelation', v as FragmentationBlock['hasAutoCorrelation'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'partial', label: 'Parcial' },
            { value: 'no', label: 'No' },
          ]}
        />
        <ToggleGroup
          label="¿Alertas llegan por múltiples fuentes?"
          value={data.alertsFromMultipleSources}
          onChange={v => set('alertsFromMultipleSources', v as FragmentationBlock['alertsFromMultipleSources'])}
          options={yesNoUnknown}
        />
        <ToggleGroup
          label="¿Se duplican dashboards o alertas?"
          value={data.duplicatedDashboards}
          onChange={v => set('duplicatedDashboards', v as FragmentationBlock['duplicatedDashboards'])}
          options={yesNoUnknown}
        />
        <ToggleGroup
          label="¿La CMDB/inventario está actualizado?"
          value={data.cmdbUpToDate}
          onChange={v => set('cmdbUpToDate', v as FragmentationBlock['cmdbUpToDate'])}
          options={[
            { value: 'yes', label: 'Sí' },
            { value: 'partial', label: 'Parcial' },
            { value: 'no', label: 'No' },
          ]}
        />
      </div>
    </div>
  );
}
