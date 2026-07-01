import { useState } from 'react';
import type { ReportModel } from '../../engine/reportModel';
import { CONFIDENCE_LABELS } from '../../utils/labels';

interface Props {
  model: ReportModel;
}

export default function ResultReading({ model }: Props) {
  const [open, setOpen] = useState(true);
  const { reading, scenarios, instanaAnnualCostFormatted, confidenceLevelKey, dataCompleteness } = model;
  const exp = scenarios.expected;
  const isNegative = reading.isNegative;

  const explanationBg = isNegative ? '#fffbf0' : '#f4fff8';
  const explanationBorder = isNegative ? '#f1c21b' : '#24a148';
  const explanationIcon = isNegative ? '⚠' : '✓';

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Encabezado colapsable */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="card-title" style={{ margin: 0 }}>Lectura del resultado</div>
        <span style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>
          {open ? '▲ Contraer' : '▼ Expandir'}
        </span>
      </div>

      {!open && (
        <p style={{ fontSize: 12, color: 'var(--ibm-text-secondary)', marginTop: 8, marginBottom: 0 }}>
          Narrativa ejecutiva, fuentes de valor, variables clave y recomendación consultiva.
        </p>
      )}

      {open && (
        <div style={{ marginTop: 16 }}>

          {/* 1. Resumen en lenguaje ejecutivo */}
          <div style={{
            background: '#f4f9ff',
            borderLeft: '4px solid #0f62fe',
            borderRadius: '0 4px 4px 0',
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f62fe', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
              Resumen ejecutivo del escenario esperado
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6, color: 'var(--ibm-text)' }}>
              Bajo los supuestos ingresados, el escenario esperado muestra un ROI estimado de{' '}
              <strong style={{ color: isNegative ? '#da1e28' : '#24a148' }}>
                {exp.roiFormatted}
              </strong>
              {'. '}
              El beneficio anual estimado es de{' '}
              <strong>{exp.totalAnnualBenefitFormatted}</strong>
              {', frente a un costo anual de Instana de '}
              <strong>{instanaAnnualCostFormatted}</strong>
              {'.'}
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6, color: 'var(--ibm-text)' }}>
              {exp.paybackMonths < 999
                ? <>El payback estimado es de <strong>{exp.paybackFormatted}</strong>.</>
                : <>La inversión <strong>no se recupera</strong> dentro del horizonte evaluado.</>
              }
              {' '}El nivel de confianza del análisis es{' '}
              <strong>{model.confidenceLevelShort.toLowerCase()}</strong>
              {' '}({Math.round(dataCompleteness)}% datos reales ingresados).
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ibm-text-secondary)', fontStyle: 'italic' }}>
              {CONFIDENCE_LABELS[confidenceLevelKey]}. Todos los valores son simulados bajo supuestos del sector.
            </p>
          </div>

          {/* 2. Explicación ROI positivo/negativo */}
          <div style={{
            background: explanationBg,
            border: `1px solid ${explanationBorder}44`,
            borderLeft: `4px solid ${explanationBorder}`,
            borderRadius: '0 4px 4px 0',
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: explanationBorder, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
              {explanationIcon} {isNegative ? 'Por qué el ROI es negativo' : 'Por qué el ROI es positivo'}
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ibm-text)' }}>
              {reading.explanation}
            </p>
          </div>

          {/* 3. Fuentes principales de valor */}
          {reading.valueSources.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ibm-text)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Principales fuentes de valor (escenario esperado)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reading.valueSources.map((src, i) => (
                  <div key={src.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--ibm-text)' }}>
                        {i === 0 ? <strong>{src.label}</strong> : src.label}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ibm-text-secondary)' }}>
                        {src.valueFormatted} · <span style={{ color: '#0f62fe', fontWeight: 600 }}>{src.pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${src.pct}%`,
                        background: i === 0 ? '#0f62fe' : i === 1 ? '#08bdba' : '#24a148',
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', marginTop: 4 }}>
                  Total estimado: <strong>{exp.totalAnnualBenefitFormatted}/año</strong>
                </div>
              </div>
            </div>
          )}

          {reading.valueSources.length === 0 && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f4f4f4', borderRadius: 4, fontSize: 13, color: 'var(--ibm-text-secondary)' }}>
              No se identifican fuentes de ahorro con los datos actuales. Complete la información de incidentes
              y active los bloques relevantes para visualizar el desglose de valor.
            </div>
          )}

          {/* 4. Variables sensibles */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ibm-text)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Variables que más influyen en el resultado
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {reading.sensitiveVars.map(v => (
                <div key={v.label} style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 4,
                  padding: '10px 12px',
                  background: '#fafafa',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', marginBottom: 3 }}>{v.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ibm-text)', marginBottom: 3 }}>{v.value}</div>
                  <div style={{ fontSize: 11, color: '#6f6f6f', fontStyle: 'italic' }}>{v.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Recomendación consultiva */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ibm-text)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Recomendación consultiva
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reading.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 12px',
                  background: '#f4f9ff',
                  border: '1px solid #0f62fe22',
                  borderRadius: 4,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f62fe', minWidth: 20, paddingTop: 1 }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ibm-text)' }}>{rec}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--ibm-text-secondary)', fontStyle: 'italic', marginTop: 10, marginBottom: 0 }}>
              Esta lectura fue generada automáticamente en base a los datos ingresados. Debe ser revisada y
              contextualizada por el consultor antes de presentarla al cliente.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
