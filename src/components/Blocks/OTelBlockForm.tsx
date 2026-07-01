import type { OTelBlock } from '../../types';
import { ToggleGroup } from '../UI/FormField';

interface Props { data: OTelBlock; onChange: (d: OTelBlock) => void }

export default function OTelBlockForm({ data, onChange }: Props) {
  const set = <K extends keyof OTelBlock>(key: K, val: OTelBlock[K]) =>
    onChange({ ...data, [key]: val });

  const readinessScore =
    ({ none: 0, poc: 30, some: 60, majority: 90 }[data.adoptionLevel] ?? 0) * 0.5 +
    (data.hasStandardInstrumentation === 'yes' ? 25 : data.hasStandardInstrumentation === 'partial' ? 12 : 0) +
    (data.usesCollector === 'yes' ? 15 : 0);

  return (
    <div>
      <ToggleGroup
        label="Nivel de adopción de OpenTelemetry"
        value={data.adoptionLevel}
        onChange={v => set('adoptionLevel', v as OTelBlock['adoptionLevel'])}
        options={[
          { value: 'none', label: 'No usa' },
          { value: 'poc', label: 'POC / Prueba' },
          { value: 'some', label: 'Algunas apps' },
          { value: 'majority', label: 'Mayoría de apps' },
        ]}
      />
      <ToggleGroup
        label="¿Usa OpenTelemetry Collector?"
        value={data.usesCollector}
        onChange={v => set('usesCollector', v as OTelBlock['usesCollector'])}
        options={[
          { value: 'yes', label: 'Sí' },
          { value: 'no', label: 'No' },
          { value: 'unknown', label: 'No sabe' },
        ]}
      />
      <ToggleGroup
        label="¿Tiene instrumentación estándar?"
        value={data.hasStandardInstrumentation}
        onChange={v => set('hasStandardInstrumentation', v as OTelBlock['hasStandardInstrumentation'])}
        options={[
          { value: 'yes', label: 'Sí' },
          { value: 'partial', label: 'Parcial' },
          { value: 'no', label: 'No' },
        ]}
      />
      <ToggleGroup
        label="¿Quiere evitar lock-in?"
        value={data.wantsToAvoidLockIn}
        onChange={v => set('wantsToAvoidLockIn', v as OTelBlock['wantsToAvoidLockIn'])}
        options={[
          { value: 'low', label: 'Bajo' },
          { value: 'medium', label: 'Medio' },
          { value: 'high', label: 'Alto' },
        ]}
      />
      <ToggleGroup
        label="¿Necesita enviar telemetría a más de un backend?"
        value={data.needsMultiBackend}
        onChange={v => set('needsMultiBackend', v as OTelBlock['needsMultiBackend'])}
        options={[
          { value: 'yes', label: 'Sí' },
          { value: 'no', label: 'No' },
          { value: 'possible', label: 'Posible' },
        ]}
      />
      <ToggleGroup
        label="¿Tiene estándares internos de instrumentación?"
        value={data.hasInternalStandards}
        onChange={v => set('hasInternalStandards', v as OTelBlock['hasInternalStandards'])}
        options={[
          { value: 'yes', label: 'Sí' },
          { value: 'partial', label: 'Parcial' },
          { value: 'no', label: 'No' },
        ]}
      />

      <div className="notice notice-info" style={{ marginTop: 12 }}>
        OpenTelemetry Readiness Score estimado: <strong>{Math.round(readinessScore)}/100</strong>.
        Instana soporta nativamente OTLP y actúa como backend OTel sin lock-in propietario.
      </div>
    </div>
  );
}
