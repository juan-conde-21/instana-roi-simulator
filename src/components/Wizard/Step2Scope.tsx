import type { ScopeSection } from '../../types';
import { ToggleGroup } from '../UI/FormField';
import { helpTexts } from '../../content/helpTexts';

interface Props { data: ScopeSection; onChange: (d: ScopeSection) => void }

const set3 = (opts: string[]) => opts.map(v => ({ value: v, label: v }));

export default function Step2Scope({ data, onChange }: Props) {
  const set = <K extends keyof ScopeSection>(key: K, val: ScopeSection[K]) =>
    onChange({ ...data, [key]: val });

  return (
    <div>
      <div className="section-header">
        <div className="section-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h2>Alcance y criticidad</h2>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-title">Aplicaciones</div>

          <ToggleGroup
            label="Cantidad aproximada de aplicaciones"
            value={data.appCount}
            onChange={v => set('appCount', v as ScopeSection['appCount'])}
            options={[
              { value: '1-3', label: '1–3' },
              { value: '4-10', label: '4–10' },
              { value: '11-30', label: '11–30' },
              { value: '31-80', label: '31–80' },
              { value: '80+', label: '80+' },
            ]}
            help={helpTexts.scope.appCount}
          />

          <ToggleGroup
            label="Tipo principal de aplicaciones"
            value={data.appType}
            onChange={v => set('appType', v as ScopeSection['appType'])}
            options={[
              { value: 'web', label: 'Web' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'api', label: 'API' },
              { value: 'core_transactional', label: 'Core transaccional' },
              { value: 'batch', label: 'Batch' },
              { value: 'middleware', label: 'Middleware' },
              { value: 'kubernetes', label: 'Kubernetes/microservicios' },
              { value: 'mixed', label: 'Mixto' },
            ]}
          />

          <ToggleGroup
            label="Criticidad promedio"
            value={data.criticality}
            onChange={v => set('criticality', v as ScopeSection['criticality'])}
            options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
              { value: 'critical', label: 'Crítica' },
            ]}
            help={helpTexts.scope.criticality}
          />
        </div>

        <div className="card">
          <div className="card-title">Operación y contexto</div>

          <ToggleGroup
            label="Horario de operación"
            value={data.operationHours}
            onChange={v => set('operationHours', v as ScopeSection['operationHours'])}
            options={set3(['8x5', '12x6', '24x7'])}
            help={helpTexts.scope.operationHours}
          />

          <ToggleGroup
            label="¿Afecta clientes externos?"
            value={data.affectsExternalClients}
            onChange={v => set('affectsExternalClients', v as ScopeSection['affectsExternalClients'])}
            options={[
              { value: 'yes', label: 'Sí' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.scope.affectsExternalClients}
          />

          <ToggleGroup
            label="¿Procesa transacciones económicas?"
            value={data.processesEconomicTransactions}
            onChange={v => set('processesEconomicTransactions', v as ScopeSection['processesEconomicTransactions'])}
            options={[
              { value: 'yes', label: 'Sí' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.scope.processesEconomicTransactions}
          />

          <ToggleGroup
            label="¿Tiene SLA o compromisos regulatorios?"
            value={data.hasSlAorRegulatory}
            onChange={v => set('hasSlAorRegulatory', v as ScopeSection['hasSlAorRegulatory'])}
            options={[
              { value: 'yes', label: 'Sí' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.scope.hasSlAorRegulatory}
          />
        </div>
      </div>

      {(data.criticality === 'critical' || data.affectsExternalClients === 'yes' || data.processesEconomicTransactions === 'yes') && (
        <div className="notice notice-warning" style={{ marginTop: 12 }}>
          El perfil de criticidad detectado es alto. Los cálculos de impacto de incidentes usarán multiplicadores elevados.
        </div>
      )}
    </div>
  );
}
