import { useState } from 'react';
import type { ScenarioType, ScenariosConfig } from '../../types';
import type { ReportModel } from '../../engine/reportModel';
import HelpTooltip from '../UI/HelpTooltip';
import { helpTexts } from '../../content/helpTexts';
import { formatCurrency, formatMonths, formatPercent, formatNumber } from '../../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import ExportButtons from '../Export/ExportButtons';
import ROIInterpretationPanel from './ROIInterpretation';
import ValidationPanel from './ValidationPanel';
import ResultReading from './ResultReading';
import DebugPanel from '../Debug/DebugPanel';
import ScenarioEditor from './ScenarioEditor';

interface Props {
  model: ReportModel;
  onScenariosChange: (cfg: ScenariosConfig) => void;
}

const SCENARIOS: ScenarioType[] = ['conservative', 'expected', 'optimistic'];
const SCENARIO_LABELS: Record<ScenarioType, string> = {
  conservative: 'Conservador', expected: 'Esperado', optimistic: 'Optimista',
};
const SCENARIO_COLORS: Record<ScenarioType, string> = {
  conservative: '#f1c21b', expected: '#0f62fe', optimistic: '#24a148',
};

const SCORE_COLORS: Record<string, string> = {
  costPressure: '#da1e28',
  apmUtilization: '#0f62fe',
  coverageRestriction: '#ff832b',
  operationalDrag: '#9f1853',
  telemetryWaste: '#f1c21b',
  fragmentation: '#da1e28',
  otelReadiness: '#08bdba',
  migrationEffort: '#ff832b',
  adoptionReadiness: '#24a148',
  roiConfidence: '#0f62fe',
};

function ScoreBar({ label, value, color, scoreKey }: { label: string; value: number; color: string; scoreKey?: string }) {
  const helpText = scoreKey ? (helpTexts.scores as Record<string, string>)[scoreKey] : undefined;
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {helpText && <HelpTooltip content={helpText} compact />}
        </span>
        <span style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function roiColor(roi: number, status: string): string {
  if (roi >= 0) return '#24a148';
  if (status === 'requires_review') return '#da1e28';
  if (status === 'negative_insufficient_data') return '#8d8d8d';
  return '#da1e28';
}

export default function Dashboard({ model, onScenariosChange }: Props) {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('expected');
  const { state, results, interpretation, validation } = model;
  const currency = state.profile.currency;
  const customCurrency = state.profile.customCurrency;
  const fmt = (v: number) => formatCurrency(v, currency, customCurrency);

  const sr = results.scenarios[activeScenario];
  const conf = results.confidenceLevel;

  // TCO comparison chart data
  const tcoData = [
    {
      name: '12 meses',
      Actual: Math.round(sr.tcoCurrentYear1 / 1000),
      Instana: Math.round(sr.tco12 / 1000),
    },
    {
      name: '24 meses',
      Actual: Math.round((sr.tcoCurrentYear1 + sr.tcoCurrentYear2) / 1000),
      Instana: Math.round(sr.tco24 / 1000),
    },
    {
      name: '36 meses',
      Actual: Math.round((sr.tcoCurrentYear1 + sr.tcoCurrentYear2 + sr.tcoCurrentYear3) / 1000),
      Instana: Math.round(sr.tco36 / 1000),
    },
  ];

  // Savings breakdown
  const savingsData = [
    { name: 'War rooms', value: Math.round(sr.warRoomSavings / 1000) },
    { name: 'Administración', value: Math.round(sr.adminSavings / 1000) },
    { name: 'Infraestructura', value: Math.round(sr.infraSavings / 1000) },
    { name: 'APM actual', value: Math.round(sr.apmRationalizationSavings / 1000) },
    { name: 'Cobertura', value: Math.round(sr.coverageValue / 1000) },
    { name: 'Fragmentación', value: Math.round(sr.fragmentationSavings / 1000) },
    { name: 'Telemetría', value: Math.round(sr.telemetrySavings / 1000) },
  ].filter(d => d.value > 0);

  // War room before/after
  const warRoomData = SCENARIOS.map(s => ({
    name: SCENARIO_LABELS[s],
    Antes: Math.round(results.warRoom.monthlyManHours),
    Después: Math.round(results.warRoom.monthlyManHours *
      (1 - (state.scenariosConfig[s].warRoomReduction[0] + state.scenariosConfig[s].warRoomReduction[1]) / 2 / 100)),
    fill: SCENARIO_COLORS[s],
  }));

  const contextScores = model.scores.slice(0, 5);
  const adoptionScores = model.scores.slice(5);

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Dashboard ROI – {state.profile.clientName || 'Escenario sin nombre'}</h2>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                background: interpretation.status === 'positive' ? '#24a148' :
                  interpretation.status === 'requires_review' ? '#da1e28' :
                  interpretation.status === 'negative_transition' ? '#ff832b' :
                  interpretation.status === 'negative_insufficient_data' ? '#8d8d8d' : '#c89200',
                color: '#fff',
              }}>
                {interpretation.badgeLabel}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 13 }}>
              Simulación consultiva basada en escenarios · Solo para referencia
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SCENARIOS.map(s => (
              <button
                key={s}
                type="button"
                className={`scenario-tab ${s}${activeScenario === s ? ' active' : ''}`}
                onClick={() => setActiveScenario(s)}
                style={{ minWidth: 100 }}
              >
                {SCENARIO_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-4" style={{ marginTop: 20 }}>
          <div className="roi-highlight" style={sr.roi < 0 ? { borderColor: 'rgba(255,255,255,0.3)' } : {}}>
            <div
              className="roi-value"
              style={{ color: roiColor(sr.roi, interpretation.status) }}
            >
              {formatPercent(sr.roi, 0)}
            </div>
            <div className="roi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              ROI {SCENARIO_LABELS[activeScenario]}
              <HelpTooltip content={helpTexts.dashboard.roi} compact />
            </div>
          </div>
          <div className="roi-highlight">
            <div className="roi-value" style={{ color: sr.paybackMonths > 36 ? '#ff832b' : undefined }}>
              {formatMonths(sr.paybackMonths)}
            </div>
            <div className="roi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              Payback estimado
              <HelpTooltip content={helpTexts.dashboard.payback} compact />
            </div>
          </div>
          <div className="roi-highlight">
            <div className="roi-value">{fmt(sr.totalAnnualBenefit)}</div>
            <div className="roi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              Beneficio anual estimado
              <HelpTooltip content={helpTexts.dashboard.grossBenefit} compact />
            </div>
          </div>
          <div className="roi-highlight">
            <div className="roi-value" style={{ color: sr.netAnnualBenefit < 0 ? '#da1e28' : '#08bdba' }}>
              {fmt(sr.netAnnualBenefit)}
            </div>
            <div className="roi-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              Beneficio neto anual
              <HelpTooltip content={helpTexts.dashboard.netBenefit} compact />
            </div>
          </div>
        </div>
      </div>

      {/* Debug panel — visible only in development */}
      <DebugPanel model={model} />

      {/* Panel de validación de datos */}
      <ValidationPanel validation={validation} />

      {/* Interpretación del resultado */}
      <ROIInterpretationPanel interpretation={interpretation} />

      <div className="simulation-disclaimer" style={{ marginBottom: 16 }}>
        ⚠️ Estos resultados son una simulación basada en supuestos del sector. No representan garantías ni compromisos comerciales.
        Nivel de confianza actual: <strong>{conf === 'high' ? 'Alto' : conf === 'medium' ? 'Medio' : 'Bajo'}</strong> ({Math.round(results.dataCompleteness)}% datos reales)
      </div>

      {/* Lectura del resultado */}
      <ResultReading model={model} />

      {/* Confidence + ROI types */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Tipos de ROI identificados</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {model.activeRoiTypeLabels.length === 0
              ? <span style={{ color: 'var(--ibm-text-secondary)', fontSize: 13 }}>Complete más secciones para identificar tipos de ROI.</span>
              : model.activeRoiTypeLabels.map(t => (
                <span key={t} className="badge badge-blue">{t}</span>
              ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Confianza del cálculo
            <HelpTooltip content={helpTexts.dashboard.confidence} compact />
          </div>
          <div className={`confidence-strip ${conf}`} style={{ marginBottom: 12 }}>
            Nivel: <strong>{conf === 'high' ? 'Alto' : conf === 'medium' ? 'Medio' : 'Bajo'}</strong> · {Math.round(results.dataCompleteness)}% campos con datos reales
          </div>
          <p style={{ fontSize: 12, color: 'var(--ibm-text-secondary)' }}>
            Ingresa datos reales en lugar de estimaciones para aumentar la confianza del análisis.
            Los campos clave son: costo APM actual, frecuencia/duración de incidentes y costos de Instana.
          </p>
        </div>
      </div>

      {/* Financial summary cards */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Costo actual anual (TCO)
            <HelpTooltip content={helpTexts.dashboard.tcoActual} compact />
          </div>
          <div className="metric-value">{fmt(results.currentAnnualCost)}</div>
          <div className="metric-sub">Incluye war rooms + APM + OS</div>
        </div>
        <div className="metric-card blue">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Costo Instana anual
            <HelpTooltip content={helpTexts.dashboard.tcoInstana} compact />
          </div>
          <div className="metric-value">{fmt(results.instanaAnnualCost)}</div>
          <div className="metric-sub">Licencia + operación + servicios</div>
        </div>
        <div className="metric-card positive">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Ahorro anual estimado
            <HelpTooltip content={helpTexts.dashboard.grossBenefit} compact />
          </div>
          <div className="metric-value">{fmt(sr.totalAnnualBenefit)}</div>
          <div className="metric-sub">Escenario {SCENARIO_LABELS[activeScenario]}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            War rooms / mes (actual)
            <HelpTooltip content={helpTexts.dashboard.warRoomCost} compact />
          </div>
          <div className="metric-value">{formatNumber(results.warRoom.monthlyManHours, 0)}h</div>
          <div className="metric-sub">{fmt(results.warRoom.annualCost)}/año · {fmt(results.warRoom.hourlyTeamCostUsed)}/h</div>
        </div>
      </div>

      {/* All scenarios comparison */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          Comparativa de escenarios
          {interpretation.isAllNegative && (
            <span className="badge badge-red" style={{ marginLeft: 8 }}>Todos negativos</span>
          )}
          {!interpretation.isAllNegative && interpretation.isExpectedNegative && (
            <span className="badge badge-yellow" style={{ marginLeft: 8 }}>Escenario esperado negativo</span>
          )}
        </div>
        <div className="grid-3">
          {SCENARIOS.map(s => {
            const r = results.scenarios[s];
            const isNeg = r.roi < 0;
            const isActive = activeScenario === s;
            return (
              <div key={s} style={{
                padding: 16,
                border: `2px solid ${isNeg ? '#da1e2822' : `${SCENARIO_COLORS[s]}22`}`,
                borderRadius: 4,
                background: isNeg ? '#fff8f8' : `${SCENARIO_COLORS[s]}08`,
                cursor: 'pointer',
                outline: isActive ? `2px solid ${isNeg ? '#da1e28' : SCENARIO_COLORS[s]}` : 'none',
                outlineOffset: 2,
                transition: 'outline 0.15s',
              }} onClick={() => setActiveScenario(s)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isNeg ? '#8d8d8d' : SCENARIO_COLORS[s] }}>
                    {SCENARIO_LABELS[s].toUpperCase()}
                  </span>
                  {isNeg && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                      background: '#da1e2815', color: '#da1e28',
                    }}>ROI−</span>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: isNeg ? '#da1e28' : 'var(--ibm-text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                  {formatPercent(r.roi, 0)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', marginBottom: 8 }}>ROI</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>Payback</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: r.paybackMonths > 36 ? '#ff832b' : 'var(--ibm-text)' }}>
                      {formatMonths(r.paybackMonths)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>Ahorro/año</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(r.totalAnnualBenefit)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">TCO comparativo (Actual vs. Instana)</div>
          <p style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', marginBottom: 12 }}>
            Miles de {currency}. Escenario: {SCENARIO_LABELS[activeScenario]}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tcoData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v}K ${currency}`, '']} />
              <Legend />
              <Bar dataKey="Actual" fill="#da1e28" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Instana" fill="#0f62fe" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Desglose de ahorros estimados</div>
          <p style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', marginBottom: 12 }}>
            Miles de {currency}. Escenario: {SCENARIO_LABELS[activeScenario]}
          </p>
          {savingsData.length === 0
            ? <p style={{ color: 'var(--ibm-text-secondary)', fontSize: 13 }}>Complete los bloques para ver el desglose de ahorros.</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={savingsData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v: number) => [`${v}K ${currency}`, 'Ahorro']} />
                  <Bar dataKey="value" fill="#08bdba" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* War room chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Horas hombre en war rooms — Antes vs. Después por escenario</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={warRoomData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip formatter={(v: number) => [`${v}h/mes`, '']} />
            <Legend />
            <Bar dataKey="Antes" fill="#da1e28" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Después" fill="#24a148" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scores — from model, Spanish labels consistent with PDF/Excel */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Scores de contexto</div>
          {contextScores.map(s => (
            <ScoreBar key={s.key} label={s.label} value={s.value} color={SCORE_COLORS[s.key] ?? '#6f6f6f'} scoreKey={s.key} />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Scores de adopción y riesgo</div>
          {adoptionScores.map(s => (
            <ScoreBar key={s.key} label={s.label} value={s.value} color={SCORE_COLORS[s.key] ?? '#6f6f6f'} scoreKey={s.key} />
          ))}
        </div>
      </div>

      {/* Live assumptions editor */}
      <ScenarioEditor config={state.scenariosConfig} onChange={onScenariosChange} />

      {/* Export */}
      <div className="card">
        <div className="card-title">Exportar simulación</div>
        <ExportButtons model={model} />
      </div>
    </div>
  );
}
