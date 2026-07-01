import { useState } from 'react';
import type { ReportModel } from '../../engine/reportModel';

interface Props {
  model: ReportModel;
}

const isDebugEnabled = () =>
  import.meta.env.DEV || localStorage.getItem('instana_roi_debug') === 'true';

export default function DebugPanel({ model }: Props) {
  const [open, setOpen] = useState(false);
  if (!isDebugEnabled()) return null;

  const exp = model.scenarios.expected;
  const con = model.scenarios.conservative;
  const opt = model.scenarios.optimistic;

  const copyJSON = () => {
    const safe = { ...model, state: model.state, results: model.results };
    navigator.clipboard.writeText(JSON.stringify(safe, null, 2)).catch(() => {
      console.log('ReportModel:', JSON.stringify(safe, null, 2));
    });
  };

  return (
    <div style={{
      margin: '12px 0',
      border: '2px dashed #da1e28',
      borderRadius: 4,
      background: '#fff8f8',
      fontSize: 11,
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', cursor: 'pointer', userSelect: 'none',
          borderBottom: open ? '1px dashed #da1e28' : 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontWeight: 700, color: '#da1e28' }}>
          🔧 Debug de cálculo — solo visible en desarrollo
        </span>
        <span style={{ color: '#da1e28' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '12px 16px' }}>

          {/* Identidad */}
          <Section title="Identidad">
            <Row label="Cliente" value={model.clientName} />
            <Row label="Industria" value={model.industryLabel} />
            <Row label="Moneda" value={model.currencyCode} />
            <Row label="Horizonte" value={model.horizonLabel} />
            <Row label="Punto de partida" value={model.startingPointLabel} />
            <Row label="Confianza" value={`${model.confidenceLevelKey} (${Math.round(model.dataCompleteness)}% datos reales)`} />
          </Section>

          {/* Escenarios */}
          <Section title="Escenarios — valores formateados">
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 10 }}>
              <thead>
                <tr>
                  {['Indicador', 'Conservador', 'Esperado', 'Optimista'].map(h => (
                    <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #e0e0e0', padding: '2px 8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['ROI', con.roiFormatted, exp.roiFormatted, opt.roiFormatted],
                  ['Payback', con.paybackFormatted, exp.paybackFormatted, opt.paybackFormatted],
                  ['Beneficio anual', con.totalAnnualBenefitFormatted, exp.totalAnnualBenefitFormatted, opt.totalAnnualBenefitFormatted],
                  ['Beneficio neto', con.netAnnualBenefitFormatted, exp.netAnnualBenefitFormatted, opt.netAnnualBenefitFormatted],
                  ['Costo Instana', con.totalAnnualCostInstanaFormatted, exp.totalAnnualCostInstanaFormatted, opt.totalAnnualCostInstanaFormatted],
                  ['War rooms', con.warRoomSavingsFormatted, exp.warRoomSavingsFormatted, opt.warRoomSavingsFormatted],
                  ['TCO 36m Instana', con.tco36Formatted, exp.tco36Formatted, opt.tco36Formatted],
                ].map(([ind, c, e, o]) => (
                  <tr key={String(ind)}>
                    <td style={{ padding: '2px 8px', color: '#525252' }}>{ind}</td>
                    <td style={{ padding: '2px 8px' }}>{c}</td>
                    <td style={{ padding: '2px 8px', fontWeight: 700 }}>{e}</td>
                    <td style={{ padding: '2px 8px' }}>{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Scores */}
          <Section title="Scores — valores calculados">
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 10 }}>
              <thead>
                <tr>
                  {['Score (label del modelo)', 'Valor', 'Interpretación'].map(h => (
                    <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #e0e0e0', padding: '2px 8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.scores.map(s => (
                  <tr key={s.key}>
                    <td style={{ padding: '2px 8px', color: '#525252' }}>{s.label}</td>
                    <td style={{ padding: '2px 8px' }}>{s.valueRounded}</td>
                    <td style={{ padding: '2px 8px' }}>{s.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Lectura */}
          <Section title="Lectura del resultado — fuentes">
            <Row label="isNegative" value={String(model.reading.isNegative)} />
            <Row label="isAllNegative" value={String(model.reading.isAllNegative)} />
            <Row label="Fuentes de valor activas" value={String(model.reading.valueSources.length)} />
            <Row label="Recomendaciones" value={String(model.reading.recommendations.length)} />
            <Row label="Variables sensibles" value={String(model.reading.sensitiveVars.length)} />
          </Section>

          {/* Interpretación */}
          <Section title="Interpretación ROI">
            <Row label="status" value={model.interpretation.status} />
            <Row label="badge" value={model.interpretation.badgeLabel} />
            <Row label="headline" value={model.interpretation.headline} />
            <Row label="drivers" value={String(model.interpretation.drivers.length)} />
          </Section>

          {/* Validación */}
          {model.validation.issues.length > 0 && (
            <Section title="Mensajes de validación">
              {model.validation.issues.map((issue, i) => (
                <Row key={i} label={`[${issue.severity}] ${issue.id}`} value={issue.message.substring(0, 80)} />
              ))}
            </Section>
          )}

          {/* ROI types */}
          <Section title="Tipos de ROI activos">
            <div style={{ color: '#525252' }}>{model.activeRoiTypeLabels.join(' · ') || '(ninguno)'}</div>
          </Section>

          {/* Costos */}
          <Section title="Costos resumen">
            <Row label="TCO actual anual" value={model.currentAnnualCostFormatted} />
            <Row label="Instana anual" value={model.instanaAnnualCostFormatted} />
            <Row label="War room mensual" value={model.warRoomMonthlyCostFormatted} />
            <Row label="War room anual" value={model.warRoomAnnualCostFormatted} />
          </Section>

          <button
            style={{ marginTop: 8, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}
            onClick={copyJSON}
          >
            📋 Copiar ReportModel como JSON
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 700, color: '#da1e28', marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
      <span style={{ color: '#525252', minWidth: 200 }}>{label}:</span>
      <span style={{ color: '#161616', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
