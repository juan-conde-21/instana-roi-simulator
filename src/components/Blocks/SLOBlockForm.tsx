import type { SLOBlock } from '../../types';
import { ToggleGroup } from '../UI/FormField';

interface Props { data: SLOBlock; onChange: (d: SLOBlock) => void }

export default function SLOBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof SLOBlock>(key: K, val: SLOBlock[K]) =>
    onChange({ ...data, [key]: val });

  const ynu = [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'No sabe' }];
  const ypn = [{ value: 'yes', label: 'Sí' }, { value: 'partial', label: 'Parcial' }, { value: 'no', label: 'No' }];

  return (
    <div className="grid-2" style={{ gap: 16 }}>
      <ToggleGroup label="¿Tiene SLO definido?" value={data.hasSlosDefined} onChange={v => set('hasSlosDefined', v as SLOBlock['hasSlosDefined'])} options={ypn} />
      <ToggleGroup label="¿Tiene SLA contractual?" value={data.hasContractualSla} onChange={v => set('hasContractualSla', v as SLOBlock['hasContractualSla'])} options={ynu} />
      <ToggleGroup label="¿Mide latencia/degradación?" value={data.measuresLatency} onChange={v => set('measuresLatency', v as SLOBlock['measuresLatency'])} options={ypn} />
      <ToggleGroup label="¿Mide experiencia de usuario?" value={data.measuresUserExperience} onChange={v => set('measuresUserExperience', v as SLOBlock['measuresUserExperience'])} options={ypn} />
      <ToggleGroup label="¿Tiene synthetic monitoring?" value={data.hasSyntheticMonitoring} onChange={v => set('hasSyntheticMonitoring', v as SLOBlock['hasSyntheticMonitoring'])} options={ynu} />
      <ToggleGroup label="¿Tiene RUM o mobile monitoring?" value={data.hasRumOrMobile} onChange={v => set('hasRumOrMobile', v as SLOBlock['hasRumOrMobile'])} options={ynu} />
    </div>
  );
}
