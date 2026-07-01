import { useState } from 'react';
import type { SimulationState, OptionalBlock } from '../../types';
import HelpTooltip from '../UI/HelpTooltip';
import { helpTexts } from '../../content/helpTexts';
import APMBlockForm from '../Blocks/APMBlockForm';
import OpenSourceBlockForm from '../Blocks/OpenSourceBlockForm';
import OTelBlockForm from '../Blocks/OTelBlockForm';
import GovernanceBlockForm from '../Blocks/GovernanceBlockForm';
import FragmentationBlockForm from '../Blocks/FragmentationBlockForm';
import MigrationBlockForm from '../Blocks/MigrationBlockForm';
import SLOBlockForm from '../Blocks/SLOBlockForm';
import SecurityBlockForm from '../Blocks/SecurityBlockForm';

interface BlockDef {
  id: OptionalBlock;
  label: string;
  desc: string;
  icon: string;
}

const BLOCKS: BlockDef[] = [
  { id: 'commercial_apm', label: 'APM comercial actual', desc: 'Dynatrace, New Relic, Datadog, AppDynamics…', icon: '💰' },
  { id: 'open_source', label: 'Open source / OSS', desc: 'Prometheus, Grafana, ELK, Jaeger…', icon: '🔧' },
  { id: 'otel', label: 'OpenTelemetry', desc: 'Adopción, collector, anti lock-in', icon: '📡' },
  { id: 'governance', label: 'Gobierno de telemetría', desc: 'Volumen, cardinalidad, sampling', icon: '🗂️' },
  { id: 'fragmentation', label: 'Fragmentación de herramientas', desc: 'Herramientas por incidente, vista única', icon: '🧩' },
  { id: 'migration', label: 'Migración / coexistencia', desc: 'Transición, doble costo, integraciones', icon: '🔄' },
  { id: 'slo_sla', label: 'SLO / SLA y experiencia', desc: 'Synthetic, RUM, SLO definidos', icon: '📊' },
  { id: 'security', label: 'Seguridad / compliance', desc: 'Data residency, compliance, on-prem', icon: '🔒' },
];

interface Props {
  state: SimulationState;
  onChange: (s: SimulationState) => void;
  initialBlock?: OptionalBlock | null;
}

export default function Step4Blocks({ state, onChange, initialBlock }: Props) {
  const [activeBlock, setActiveBlock] = useState<OptionalBlock | null>(initialBlock ?? null);
  const activeBlocks = state.blocks.activeBlocks;

  const toggleBlock = (id: OptionalBlock) => {
    const next = activeBlocks.includes(id)
      ? activeBlocks.filter(b => b !== id)
      : [...activeBlocks, id];
    onChange({ ...state, blocks: { activeBlocks: next } });
    if (!activeBlocks.includes(id)) setActiveBlock(id);
    else if (activeBlock === id) setActiveBlock(null);
  };

  const renderBlockForm = () => {
    if (!activeBlock || !activeBlocks.includes(activeBlock)) return null;
    switch (activeBlock) {
      case 'commercial_apm':
        return <APMBlockForm data={state.apmBlock} onChange={d => onChange({ ...state, apmBlock: d })} />;
      case 'open_source':
        return <OpenSourceBlockForm data={state.openSourceBlock} onChange={d => onChange({ ...state, openSourceBlock: d })} />;
      case 'otel':
        return <OTelBlockForm data={state.otelBlock} onChange={d => onChange({ ...state, otelBlock: d })} />;
      case 'governance':
        return <GovernanceBlockForm data={state.governanceBlock} onChange={d => onChange({ ...state, governanceBlock: d })} />;
      case 'fragmentation':
        return <FragmentationBlockForm data={state.fragmentationBlock} onChange={d => onChange({ ...state, fragmentationBlock: d })} />;
      case 'migration':
        return <MigrationBlockForm data={state.migrationBlock} onChange={d => onChange({ ...state, migrationBlock: d })} />;
      case 'slo_sla':
        return <SLOBlockForm data={state.sloBlock} onChange={d => onChange({ ...state, sloBlock: d })} />;
      case 'security':
        return <SecurityBlockForm data={state.securityBlock} onChange={d => onChange({ ...state, securityBlock: d })} />;
      default: return null;
    }
  };

  // Auto-activate blocks based on starting point
  const suggestedBlocks: OptionalBlock[] = [];
  if (state.profile.startingPoint === 'commercial_apm') suggestedBlocks.push('commercial_apm');
  if (state.profile.startingPoint === 'open_source') suggestedBlocks.push('open_source');
  if (state.profile.startingPoint === 'multiple_tools') {
    suggestedBlocks.push('commercial_apm', 'open_source', 'fragmentation');
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <h2>Bloques opcionales</h2>
      </div>

      {suggestedBlocks.length > 0 && (
        <div className="notice notice-info" style={{ marginBottom: 16 }}>
          Según tu punto de partida, se sugiere activar:{' '}
          {suggestedBlocks.map(b => BLOCKS.find(bl => bl.id === b)?.label).join(', ')}
        </div>
      )}

      <div className="notice notice-warning" style={{ marginBottom: 16 }}>
        Los bloques son complementarios y no excluyentes. Activa todos los que apliquen al contexto del cliente.
      </div>

      <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
        {BLOCKS.map(block => {
          const isActive = activeBlocks.includes(block.id);
          const helpText = helpTexts.blocks[block.id as keyof typeof helpTexts.blocks];
          return (
            <div
              key={block.id}
              className={`block-toggle${isActive ? ' active' : ''}`}
              onClick={() => toggleBlock(block.id)}
            >
              <div className="block-toggle-icon">{block.icon}</div>
              <div className="block-toggle-content">
                <div className="block-toggle-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {block.label}
                  {helpText && (
                    <span onClick={e => e.stopPropagation()}>
                      <HelpTooltip content={helpText} placement="right" compact />
                    </span>
                  )}
                </div>
                <div className="block-toggle-desc">{block.desc}</div>
              </div>
              <div className="block-toggle-check">
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeBlocks.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>
            Detalle de bloques activos
            <span className="badge badge-blue" style={{ marginLeft: 8 }}>{activeBlocks.length} activos</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {BLOCKS.filter(b => activeBlocks.includes(b.id)).map(block => (
              <button
                key={block.id}
                type="button"
                className={`btn btn-sm${activeBlock === block.id ? ' btn-primary' : ' btn-ghost'}`}
                onClick={() => setActiveBlock(activeBlock === block.id ? null : block.id)}
              >
                {block.icon} {block.label}
              </button>
            ))}
          </div>

          {renderBlockForm()}
        </div>
      )}
    </div>
  );
}
