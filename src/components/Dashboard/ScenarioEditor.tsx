import React, { useState } from 'react';
import type { ScenariosConfig, ScenarioAssumptions, ScenarioType } from '../../types';
import { DEFAULT_SCENARIOS_CONFIG } from '../../data/defaults';
import HelpTooltip from '../UI/HelpTooltip';
import { helpTexts } from '../../content/helpTexts';

interface Props {
  config: ScenariosConfig;
  onChange: (cfg: ScenariosConfig) => void;
}

const SCENARIOS: ScenarioType[] = ['conservative', 'expected', 'optimistic'];
const SCENARIO_LABELS: Record<ScenarioType, string> = {
  conservative: 'Conservador', expected: 'Esperado', optimistic: 'Optimista',
};
const SCENARIO_COLORS: Record<ScenarioType, string> = {
  conservative: '#f1c21b', expected: '#0f62fe', optimistic: '#24a148',
};

type ParamKey = keyof ScenarioAssumptions;
const PARAMS: { key: ParamKey; label: string; hint: string }[] = [
  { key: 'mttrReduction',        label: 'Reducción MTTR',          hint: 'Mejora en tiempo de resolución de incidentes' },
  { key: 'mttdReduction',        label: 'Reducción MTTD',          hint: 'Mejora en tiempo de detección' },
  { key: 'warRoomReduction',     label: 'Reducción war rooms',      hint: 'Reducción de horas hombre en war rooms' },
  { key: 'adminReduction',       label: 'Reducción administración', hint: 'Ahorro en tareas de administración APM' },
  { key: 'coverageImprovement',  label: 'Mejora cobertura',         hint: 'Expansión de la cobertura de monitoreo' },
  { key: 'fragmentationReduction', label: 'Reducción fragmentación', hint: 'Consolidación de herramientas' },
];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function RangeCell({
  value,
  onChange,
  color,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  color: string;
}) {
  const [lo, hi] = value;
  // Track whether the last change forced an auto-adjustment (min>max or max<min)
  const [loAdjusted, setLoAdjusted] = React.useState(false);
  const [hiAdjusted, setHiAdjusted] = React.useState(false);

  const setLo = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return; // ignore non-numeric — keep previous value
    const n = clamp(parsed, 0, 100);
    const forced = n > hi;
    setLoAdjusted(false);
    setHiAdjusted(forced);
    onChange([n, forced ? n : hi]);
  };
  const setHi = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return;
    const n = clamp(parsed, 0, 100);
    const forced = n < lo;
    setHiAdjusted(false);
    setLoAdjusted(forced);
    onChange([forced ? n : lo, n]);
  };

  const baseStyle: React.CSSProperties = {
    width: 48,
    padding: '3px 4px',
    border: '1px solid var(--ibm-border)',
    borderRadius: 2,
    fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace',
    textAlign: 'right' as const,
    background: 'var(--ibm-field)',
    color: 'var(--ibm-text)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <input
        type="number"
        min={0}
        max={100}
        value={lo}
        title={loAdjusted ? 'Ajustado automáticamente para no superar el máximo' : undefined}
        onChange={e => setLo(e.target.value)}
        onBlur={() => setLoAdjusted(false)}
        style={{
          ...baseStyle,
          borderColor: loAdjusted ? '#f1c21b' : color + '88',
          boxShadow: loAdjusted ? '0 0 0 2px #f1c21b44' : undefined,
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>–</span>
      <input
        type="number"
        min={0}
        max={100}
        value={hi}
        title={hiAdjusted ? 'Ajustado automáticamente para no ser menor que el mínimo' : undefined}
        onChange={e => setHi(e.target.value)}
        onBlur={() => setHiAdjusted(false)}
        style={{
          ...baseStyle,
          borderColor: hiAdjusted ? '#f1c21b' : color + '88',
          boxShadow: hiAdjusted ? '0 0 0 2px #f1c21b44' : undefined,
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>%</span>
    </div>
  );
}

export default function ScenarioEditor({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = (scenario: ScenarioType, param: ParamKey, value: [number, number]) => {
    onChange({
      ...config,
      [scenario]: { ...config[scenario], [param]: value },
    });
  };

  const reset = () => {
    if (window.confirm('¿Restaurar los supuestos a los valores por defecto?')) {
      onChange(DEFAULT_SCENARIOS_CONFIG);
    }
  };

  const isModified = JSON.stringify(config) !== JSON.stringify(DEFAULT_SCENARIOS_CONFIG);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 16 : 0 }}>
        <div>
          <div className="card-title" style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            Supuestos de escenarios
            <HelpTooltip content={helpTexts.scenarioEditor.general} />
            {isModified && (
              <span className="badge badge-blue" style={{ marginLeft: 4, fontSize: 10 }}>Personalizado</span>
            )}
          </div>
          {!open && (
            <p style={{ fontSize: 12, color: isModified ? '#c89200' : 'var(--ibm-text-secondary)', margin: 0 }}>
              {isModified
                ? '⚠ Usando supuestos personalizados · Click para editar'
                : 'Usando supuestos por defecto · Click para editar y ver el impacto en tiempo real'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {isModified && open && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={reset}>
                Restaurar defaults
              </button>
              <HelpTooltip content={helpTexts.scenarioEditor.restoreDefaults} compact />
            </div>
          )}
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setOpen(o => !o)}>
            {open ? 'Cerrar ▲' : 'Editar supuestos ▼'}
          </button>
        </div>
      </div>

      {open && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--ibm-text-secondary)', marginBottom: 16 }}>
            Ajusta los rangos mínimo–máximo (%) de mejora esperada para cada escenario.
            Los cambios actualizan el ROI en tiempo real. No representan garantías comerciales.
          </p>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 160px)', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ibm-text-secondary)' }}>
              Parámetro
              <HelpTooltip content={helpTexts.scenarioEditor.minMax} compact />
            </div>
            {SCENARIOS.map(s => (
              <div key={s} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: SCENARIO_COLORS[s] }}>
                {SCENARIO_LABELS[s]}
              </div>
            ))}
          </div>

          {/* Param rows */}
          {PARAMS.map(({ key, label, hint }) => {
            const paramHelp = (helpTexts.scenarioEditor as Record<string, string>)[key];
            return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr repeat(3, 160px)',
                gap: 8,
                marginBottom: 10,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {label}
                  {paramHelp && <HelpTooltip content={paramHelp} compact />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>{hint}</div>
              </div>
              {SCENARIOS.map(s => (
                <RangeCell
                  key={s}
                  value={config[s][key]}
                  color={SCENARIO_COLORS[s]}
                  onChange={v => update(s, key, v)}
                />
              ))}
            </div>
            );
          })}

          <div style={{ borderTop: '1px solid var(--ibm-border)', paddingTop: 10, marginTop: 4 }}>
            <p style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', margin: 0 }}>
              Consejo: el escenario conservador aplica el mínimo del rango; el optimista aplica el máximo.
              El esperado usa el promedio del rango definido.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
