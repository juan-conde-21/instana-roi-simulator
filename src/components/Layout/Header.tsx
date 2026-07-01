import type { ConfidenceLevel } from '../../types';

const STEP_TITLES = [
  'Perfil del cliente',
  'Alcance y criticidad',
  'Incidentes y war rooms',
  'Bloques opcionales',
  'Costos de Instana',
  'Dashboard ROI',
];

interface HeaderProps {
  step: number;
  clientName: string;
  confidence?: ConfidenceLevel;
  dataCompleteness?: number;
  onLoadDemo: () => void;
  onReset: () => void;
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  low: 'Confianza baja',
  medium: 'Confianza media',
  high: 'Confianza alta',
};

export default function Header({ step, clientName, confidence, dataCompleteness, onLoadDemo, onReset }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-title">
        {STEP_TITLES[step] ?? 'Simulador ROI'}
        {clientName && (
          <span style={{ fontSize: 12, color: 'var(--ibm-text-secondary)', marginLeft: 8, fontWeight: 400 }}>
            — {clientName}
          </span>
        )}
      </div>

      <div className="header-actions">
        {confidence && dataCompleteness !== undefined && (
          <span className={`confidence-strip ${confidence}`}>
            {CONFIDENCE_LABELS[confidence]} · {Math.round(dataCompleteness)}% datos reales
          </span>
        )}

        <button className="btn btn-ghost btn-sm" onClick={onLoadDemo}>
          Cargar demo
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onReset} style={{ color: 'var(--ibm-red)' }}>
          Limpiar
        </button>
      </div>
    </header>
  );
}
