import React, { useState, useRef, useEffect, useCallback, useId } from 'react';

interface Props {
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'right';
  compact?: boolean;
}

export default function HelpTooltip({ content, title, placement = 'top', compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState(placement);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const autoPlace = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    if (placement === 'top' && rect.top < 180) {
      setResolvedPlacement('bottom');
    } else {
      setResolvedPlacement(placement);
    }
  }, [placement]);

  const show = () => { autoPlace(); setOpen(true); };
  const hide = () => setOpen(false);
  const toggle = () => { if (!open) { autoPlace(); setOpen(true); } else { setOpen(false); } };

  // Close on Escape or outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    const onOutside = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) hide();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [open]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 600,
    width: compact ? 220 : 280,
    background: '#1c2c3d',
    color: '#f4f4f4',
    borderRadius: 4,
    padding: '10px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
    fontSize: 12,
    lineHeight: 1.5,
    pointerEvents: 'auto',
    // Horizontal centering off button for top/bottom
    ...(resolvedPlacement === 'right' ? {
      left: 'calc(100% + 6px)',
      top: '50%',
      transform: 'translateY(-50%)',
    } : resolvedPlacement === 'bottom' ? {
      top: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)',
    } : {
      bottom: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)',
    }),
  };

  return (
    <span
      className="help-tooltip-wrap"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
    >
      <button
        ref={btnRef}
        type="button"
        className="help-btn"
        aria-label="Ayuda"
        aria-expanded={open}
        aria-controls={tooltipId}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={toggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '1.5px solid var(--ibm-text-secondary)',
          background: 'transparent',
          color: 'var(--ibm-text-secondary)',
          fontSize: 10,
          fontWeight: 700,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
          transition: 'border-color 0.15s, color 0.15s',
          outline: 'none',
        }}
      >
        ?
      </button>

      {open && (
        <div
          id={tooltipId}
          ref={panelRef}
          role="tooltip"
          style={panelStyle}
        >
          {title && (
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#a6c8ff', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {title}
            </div>
          )}
          <div style={{ color: '#f4f4f4' }}>{content}</div>
        </div>
      )}
    </span>
  );
}

// ─── InfoCallout — ayuda contextual inline (sin ícono, siempre visible) ───────

interface CalloutProps {
  children: React.ReactNode;
  variant?: 'info' | 'tip';
}

export function InfoCallout({ children, variant = 'info' }: CalloutProps) {
  const bg = variant === 'tip' ? '#edf5ff' : '#f4f4f4';
  const border = variant === 'tip' ? '#0f62fe' : '#8d8d8d';
  return (
    <div style={{
      background: bg,
      borderLeft: `3px solid ${border}`,
      borderRadius: '0 4px 4px 0',
      padding: '8px 12px',
      fontSize: 12,
      color: 'var(--ibm-text-secondary)',
      lineHeight: 1.5,
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}
