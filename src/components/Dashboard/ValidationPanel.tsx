import { useState } from 'react';
import type { ValidationResult, ValidationSeverity } from '../../types';

interface Props {
  validation: ValidationResult;
}

const SEVERITY_CONFIG: Record<ValidationSeverity, { bg: string; border: string; icon: string; label: string }> = {
  error: { bg: '#fff8f8', border: '#da1e28', icon: '✕', label: 'Error' },
  warning: { bg: '#fffbf0', border: '#f1c21b', icon: '⚠', label: 'Advertencia' },
  info: { bg: '#f4f9ff', border: '#0f62fe', icon: 'ℹ', label: 'Info' },
};

export default function ValidationPanel({ validation }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (validation.issues.length === 0) return null;

  const bannerBg = validation.hasErrors ? '#fff8f8' : validation.hasWarnings ? '#fffbf0' : '#f4f9ff';
  const bannerBorder = validation.hasErrors ? '#da1e28' : validation.hasWarnings ? '#f1c21b' : '#0f62fe';
  const bannerIcon = validation.hasErrors ? '✕' : validation.hasWarnings ? '⚠' : 'ℹ';
  const bannerTitle = validation.hasErrors
    ? `${validation.issues.filter(i => i.severity === 'error').length} error(s) que requieren atención`
    : validation.hasWarnings
    ? `${validation.issues.filter(i => i.severity === 'warning').length} advertencia(s) de calidad de datos`
    : `${validation.issues.length} sugerencia(s) de mejora`;

  return (
    <div style={{
      marginBottom: 16,
      border: `1px solid ${bannerBorder}`,
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div
        style={{
          background: bannerBg,
          borderLeft: `4px solid ${bannerBorder}`,
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{bannerIcon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: bannerBorder }}>{bannerTitle}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>
          {expanded ? '▲ Ocultar' : '▼ Mostrar'}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '12px 14px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {validation.issues.map(issue => {
            const cfg = SEVERITY_CONFIG[issue.severity];
            return (
              <div key={issue.id} style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}44`,
                borderLeft: `3px solid ${cfg.border}`,
                borderRadius: 4,
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: cfg.border }}>{cfg.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.border }}>{cfg.label}</span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--ibm-text)' }}>{issue.message}</p>
                {issue.suggestion && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ibm-text-secondary)', fontStyle: 'italic' }}>
                    💡 {issue.suggestion}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
