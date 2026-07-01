import { useState } from 'react';
import type { ROIInterpretation, ROIStatus, ROIDriverSeverity } from '../../types';
import { formatPercent } from '../../utils/format';

interface Props {
  interpretation: ROIInterpretation;
}

// ─── Badge config por estado ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<ROIStatus, {
  badgeClass: string;
  borderColor: string;
  bgColor: string;
  icon: string;
  accentColor: string;
}> = {
  positive: {
    badgeClass: 'badge-green',
    borderColor: '#24a148',
    bgColor: '#f2fbf4',
    icon: '✓',
    accentColor: '#24a148',
  },
  negative_valid: {
    badgeClass: 'badge-yellow',
    borderColor: '#f1c21b',
    bgColor: '#fffef0',
    icon: '◎',
    accentColor: '#c89200',
  },
  negative_transition: {
    badgeClass: 'badge-orange',
    borderColor: '#ff832b',
    bgColor: '#fff8f2',
    icon: '⟳',
    accentColor: '#d45a00',
  },
  negative_insufficient_data: {
    badgeClass: 'badge-gray',
    borderColor: '#8d8d8d',
    bgColor: '#f4f4f4',
    icon: '?',
    accentColor: '#525252',
  },
  requires_review: {
    badgeClass: 'badge-red',
    borderColor: '#da1e28',
    bgColor: '#fff1f1',
    icon: '⚠',
    accentColor: '#da1e28',
  },
};

const SEVERITY_COLORS: Record<ROIDriverSeverity, string> = {
  critical: '#da1e28',
  high: '#ff832b',
  medium: '#c89200',
  low: '#525252',
};

const SEVERITY_LABELS: Record<ROIDriverSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const CATEGORY_ICONS: Record<string, string> = {
  cost: '💰',
  benefit: '📈',
  data: '📋',
  transition: '🔄',
  context: '💡',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ScenarioMiniBar({ label, roi, className }: { label: string; roi: number; className: string }) {
  const isPositive = roi >= 0;
  const barWidth = Math.min(100, Math.abs(roi) / 2);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 88, fontSize: 11, color: 'var(--ibm-text-secondary)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#e0e0e0', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: isPositive ? '50%' : `${50 - barWidth / 2}%`,
          width: `${barWidth / 2}%`,
          height: '100%',
          background: isPositive ? '#24a148' : '#da1e28',
          borderRadius: 4,
          maxWidth: '50%',
        }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: '#8d8d8d' }} />
      </div>
      <span style={{
        width: 60,
        fontSize: 11,
        fontWeight: 700,
        textAlign: 'right',
        color: isPositive ? '#24a148' : '#da1e28',
        flexShrink: 0,
        fontFamily: 'IBM Plex Mono, monospace',
      }}>
        {formatPercent(roi, 1)}
      </span>
      <span className={`badge badge-sm ${className}`} style={{ fontSize: 9, padding: '1px 6px' }}>
        {isPositive ? '✓' : '✗'}
      </span>
    </div>
  );
}

function CollapsibleSection({
  title, icon, children, defaultOpen = false, count,
}: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '10px 14px', background: '#f4f4f4',
          border: '1px solid var(--ibm-border)', borderRadius: open ? '4px 4px 0 0' : 4,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          color: 'var(--ibm-text)', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ flex: 1 }}>{title}</span>
        {count !== undefined && (
          <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 7px' }}>{count}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          border: '1px solid var(--ibm-border)', borderTop: 'none',
          borderRadius: '0 0 4px 4px', padding: '14px 16px', background: '#fff',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ROIInterpretationPanel({ interpretation }: Props) {
  const cfg = STATUS_CONFIG[interpretation.status];
  const {
    badgeLabel, headline, context, scenarioComparison,
    drivers, validationSuggestions, improvementActions, isExpectedNegative,
  } = interpretation;

  return (
    <div
      className="card"
      style={{
        border: `2px solid ${cfg.borderColor}`,
        background: cfg.bgColor,
        marginBottom: 16,
      }}
    >
      {/* ── Cabecera ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 4, background: cfg.borderColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 20, flexShrink: 0, fontWeight: 700,
        }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ibm-text)' }}>
              Interpretación del resultado
            </span>
            <span
              className={`badge ${cfg.badgeClass}`}
              style={{ fontSize: 11, padding: '3px 10px', fontWeight: 700 }}
            >
              {badgeLabel}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ibm-text)', lineHeight: 1.5, margin: 0 }}>
            {headline}
          </p>
        </div>
      </div>

      {/* ── Contexto narrativo ── */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: 4,
        fontSize: 13,
        lineHeight: 1.7,
        color: 'var(--ibm-text)',
        marginBottom: 16,
        borderLeft: `3px solid ${cfg.borderColor}`,
      }}>
        {context}
      </div>

      {/* ── Comparativa de escenarios ── */}
      <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ibm-text-secondary)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          ROI por escenario
        </div>
        <ScenarioMiniBar
          label="Conservador"
          roi={scenarioComparison.conservativeROI}
          className={scenarioComparison.conservativePositive ? 'badge-green' : 'badge-red'}
        />
        <ScenarioMiniBar
          label="Esperado"
          roi={scenarioComparison.expectedROI}
          className={scenarioComparison.expectedPositive ? 'badge-green' : 'badge-red'}
        />
        <ScenarioMiniBar
          label="Optimista"
          roi={scenarioComparison.optimisticROI}
          className={scenarioComparison.optimisticPositive ? 'badge-green' : 'badge-red'}
        />
        {!scenarioComparison.expectedPositive && scenarioComparison.optimisticPositive && (
          <p style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', marginTop: 6, margin: '6px 0 0' }}>
            💡 El escenario optimista es positivo, lo que indica que el caso de negocio es viable si se capturan todos los beneficios identificados.
          </p>
        )}
        {!scenarioComparison.optimisticPositive && isExpectedNegative && (
          <p style={{ fontSize: 11, color: '#da1e28', marginTop: 6, margin: '6px 0 0' }}>
            Los tres escenarios son negativos con los valores actuales. Revisar los factores identificados abajo.
          </p>
        )}
      </div>

      {/* ── Factores clave ── */}
      {drivers.length > 0 && (
        <CollapsibleSection
          title="Factores que impactan el resultado"
          icon="🔍"
          defaultOpen={isExpectedNegative}
          count={drivers.length}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drivers.map(d => (
              <div key={d.id} style={{
                padding: '10px 12px',
                border: `1px solid ${SEVERITY_COLORS[d.severity]}33`,
                borderLeft: `3px solid ${SEVERITY_COLORS[d.severity]}`,
                borderRadius: 4,
                background: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[d.category]}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{d.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                    background: `${SEVERITY_COLORS[d.severity]}22`,
                    color: SEVERITY_COLORS[d.severity],
                  }}>
                    {SEVERITY_LABELS[d.severity]}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ibm-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {d.description}
                </p>
                {d.value && (
                  <p style={{ fontSize: 11, color: cfg.accentColor, fontWeight: 600, marginTop: 4, margin: '4px 0 0' }}>
                    → {d.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Validación requerida ── */}
      {validationSuggestions.length > 0 && (
        <CollapsibleSection
          title="Datos a validar con el cliente"
          icon="📋"
          defaultOpen={interpretation.status === 'requires_review' || interpretation.status === 'negative_insufficient_data'}
          count={validationSuggestions.length}
        >
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {validationSuggestions.map((s, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ibm-text)', marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── Acciones de mejora ── */}
      {improvementActions.length > 0 && (
        <CollapsibleSection
          title="Acciones para fortalecer el caso de negocio"
          icon="🚀"
          defaultOpen={false}
          count={improvementActions.length}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {improvementActions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 10px', background: '#f0f6ff', borderRadius: 4,
                border: '1px solid var(--ibm-blue-light)',
              }}>
                <span style={{ color: 'var(--ibm-blue)', fontWeight: 700, flexShrink: 0, fontSize: 13 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, color: 'var(--ibm-text)', lineHeight: 1.6 }}>{a}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Pie de nota ── */}
      <div style={{
        marginTop: 14, padding: '8px 12px',
        background: 'rgba(0,0,0,0.03)', borderRadius: 4,
        fontSize: 11, color: 'var(--ibm-text-secondary)', textAlign: 'center',
      }}>
        Esta interpretación es generada automáticamente por el simulador a partir de los datos ingresados.
        Debe ser revisada y adaptada por el consultor antes de presentarla al cliente.
      </div>
    </div>
  );
}
