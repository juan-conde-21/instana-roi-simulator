import type { OptionalBlock } from '../../types';

interface Step {
  id: number;
  label: string;
  sublabel?: string;
}

const MAIN_STEPS: Step[] = [
  { id: 0, label: 'Perfil inicial', sublabel: 'Cliente e industria' },
  { id: 1, label: 'Alcance', sublabel: 'Apps y criticidad' },
  { id: 2, label: 'Incidentes', sublabel: 'War rooms' },
  { id: 3, label: 'Bloques opcionales', sublabel: 'Selección múltiple' },
  { id: 4, label: 'Costos Instana', sublabel: 'Inversión estimada' },
  { id: 5, label: 'Dashboard ROI', sublabel: 'Resultados y exportables' },
];

const BLOCK_STEPS: Array<{ id: OptionalBlock; label: string }> = [
  { id: 'commercial_apm', label: 'APM comercial actual' },
  { id: 'open_source', label: 'Open source / OSS' },
  { id: 'otel', label: 'OpenTelemetry' },
  { id: 'governance', label: 'Gobierno telemetría' },
  { id: 'fragmentation', label: 'Fragmentación' },
  { id: 'migration', label: 'Migración / coexistencia' },
  { id: 'slo_sla', label: 'SLO / SLA' },
  { id: 'security', label: 'Seguridad / compliance' },
];

interface SidebarProps {
  currentStep: number;
  onStep: (step: number) => void;
  activeBlocks: OptionalBlock[];
  currentBlock: OptionalBlock | null;
  onBlock: (block: OptionalBlock) => void;
}

export default function Sidebar({ currentStep, onStep, activeBlocks, currentBlock, onBlock }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Simulador ROI</h1>
        <span>IBM Instana · Observabilidad</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Flujo principal</div>
        {MAIN_STEPS.map(step => (
          <div
            key={step.id}
            className={`sidebar-item${currentStep === step.id ? ' active' : ''}`}
            onClick={() => onStep(step.id)}
          >
            <span className="step-num">{step.id + 1}</span>
            <span className="step-label">
              <span style={{ display: 'block' }}>{step.label}</span>
              {step.sublabel && (
                <span style={{ fontSize: 10, opacity: 0.6 }}>{step.sublabel}</span>
              )}
            </span>
          </div>
        ))}

        {activeBlocks.length > 0 && (
          <>
            <div className="sidebar-section-title" style={{ marginTop: 8 }}>Bloques activos</div>
            {BLOCK_STEPS.filter(b => activeBlocks.includes(b.id)).map(block => (
              <div
                key={block.id}
                className={`sidebar-item${currentStep === 3 && currentBlock === block.id ? ' active' : ''}`}
                onClick={() => { onStep(3); onBlock(block.id); }}
                style={{ paddingLeft: 28 }}
              >
                <span className="step-num" style={{ background: 'rgba(8,189,186,0.2)', color: 'var(--ibm-teal)' }}>
                  ●
                </span>
                <span className="step-label" style={{ fontSize: 12 }}>{block.label}</span>
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        Herramienta consultiva · Solo simulación
      </div>
    </aside>
  );
}
