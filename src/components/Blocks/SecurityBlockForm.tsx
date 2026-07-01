import type { SecurityBlock } from '../../types';
import { ToggleGroup } from '../UI/FormField';

interface Props { data: SecurityBlock; onChange: (d: SecurityBlock) => void }

export default function SecurityBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof SecurityBlock>(key: K, val: SecurityBlock[K]) =>
    onChange({ ...data, [key]: val });

  const ynu = [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'No sabe' }];
  const ypnu = [...ynu, { value: 'partial', label: 'Parcial' }];

  return (
    <div className="grid-2" style={{ gap: 16 }}>
      <ToggleGroup label="¿Tiene requisitos de data residency?" value={data.hasDataResidencyRequirements} onChange={v => set('hasDataResidencyRequirements', v as SecurityBlock['hasDataResidencyRequirements'])} options={ynu} />
      <ToggleGroup label="¿Tiene requisitos de compliance?" value={data.hasComplianceRequirements} onChange={v => set('hasComplianceRequirements', v as SecurityBlock['hasComplianceRequirements'])} options={ynu} />
      <ToggleGroup label="¿Requiere despliegue on-premises?" value={data.requiresOnPrem} onChange={v => set('requiresOnPrem', v as SecurityBlock['requiresOnPrem'])} options={ynu} />
      <ToggleGroup label="¿La herramienta actual cumple compliance?" value={data.currentToolMeetsCompliance} onChange={v => set('currentToolMeetsCompliance', v as SecurityBlock['currentToolMeetsCompliance'])} options={ypnu} />
    </div>
  );
}
