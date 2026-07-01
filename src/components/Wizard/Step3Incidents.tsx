import type { IncidentsSection } from '../../types';
import type { WarRoomMetrics } from '../../types';
import { ToggleGroup, NumberField } from '../UI/FormField';
import HelpTooltip from '../UI/HelpTooltip';
import { formatCurrency, formatNumber } from '../../utils/format';
import type { Currency } from '../../types';
import { helpTexts } from '../../content/helpTexts';

interface Props {
  data: IncidentsSection;
  onChange: (d: IncidentsSection) => void;
  warRoom: WarRoomMetrics;
  currency: Currency;
  customCurrency: string;
  industry: string;
}

const HOURLY_ESTIMATES: Record<string, number> = {
  banking: 120, insurance: 110, retail: 70, telecom: 90, government: 65,
  health: 85, education: 55, manufacturing: 75, tech: 100, other: 80,
};

export default function Step3Incidents({ data, onChange, warRoom, currency, customCurrency, industry }: Props) {
  const set = <K extends keyof IncidentsSection>(key: K, val: IncidentsSection[K]) =>
    onChange({ ...data, [key]: val });

  const estimatedHourly = HOURLY_ESTIMATES[industry] ?? 80;
  const fmt = (v: number) => formatCurrency(v, currency, customCurrency);

  return (
    <div>
      <div className="section-header">
        <div className="section-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2>Incidentes y war rooms</h2>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-title">Frecuencia y tiempos</div>

          <ToggleGroup
            label="Frecuencia de incidentes relevantes al mes"
            value={data.incidentFrequency}
            onChange={v => set('incidentFrequency', v as IncidentsSection['incidentFrequency'])}
            options={[
              { value: '0-1', label: '0–1' },
              { value: '2-4', label: '2–4' },
              { value: '5-10', label: '5–10' },
              { value: '10+', label: '10+' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.incidents.incidentFrequency}
          />

          <ToggleGroup
            label="Tiempo típico de detección (MTTD)"
            value={data.detectionTime}
            onChange={v => set('detectionTime', v as IncidentsSection['detectionTime'])}
            options={[
              { value: '<10min', label: '< 10 min' },
              { value: '10-30min', label: '10–30 min' },
              { value: '30-60min', label: '30–60 min' },
              { value: '>1h', label: '> 1 hora' },
              { value: 'user_reported', label: 'Lo reporta el usuario' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.incidents.mttd}
          />

          <ToggleGroup
            label="Tiempo típico de resolución (MTTR)"
            value={data.resolutionTime}
            onChange={v => set('resolutionTime', v as IncidentsSection['resolutionTime'])}
            options={[
              { value: '<30min', label: '< 30 min' },
              { value: '30min-2h', label: '30 min–2 h' },
              { value: '2-6h', label: '2–6 h' },
              { value: '>6h', label: '> 6 h' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.incidents.mttr}
          />

          <ToggleGroup
            label="¿Se logra causa raíz en el mismo war room?"
            value={data.rootCauseInWarRoom}
            onChange={v => set('rootCauseInWarRoom', v as IncidentsSection['rootCauseInWarRoom'])}
            options={[
              { value: 'always', label: 'Siempre' },
              { value: 'sometimes', label: 'A veces' },
              { value: 'rarely', label: 'Casi nunca' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.incidents.rootCause}
          />
        </div>

        <div className="card">
          <div className="card-title">Estructura del war room</div>

          <ToggleGroup
            label="Duración promedio de war room"
            value={data.warRoomDuration}
            onChange={v => set('warRoomDuration', v as IncidentsSection['warRoomDuration'])}
            options={[
              { value: '<1h', label: '< 1 h' },
              { value: '1-3h', label: '1–3 h' },
              { value: '3-6h', label: '3–6 h' },
              { value: '>6h', label: '> 6 h' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.incidents.warRoomDuration}
          />

          <ToggleGroup
            label="Personas involucradas en un war room"
            value={data.warRoomPeople}
            onChange={v => set('warRoomPeople', v as IncidentsSection['warRoomPeople'])}
            options={[
              { value: '1-3', label: '1–3' },
              { value: '4-8', label: '4–8' },
              { value: '9-15', label: '9–15' },
              { value: '16+', label: '16+' },
              { value: 'unknown', label: 'No sabe' },
            ]}
            help={helpTexts.incidents.warRoomPeople}
          />

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Costo hora promedio del equipo</label>
              <HelpTooltip content={helpTexts.incidents.hourlyCost} />
            </div>
            <div className="toggle-group" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className={`toggle-option${data.useEstimatedHourlyCost ? ' selected' : ''}`}
                onClick={() => set('useEstimatedHourlyCost', true)}
              >
                Usar estimado por industria ({formatCurrency(estimatedHourly, currency, customCurrency)}/h)
              </button>
              <button
                type="button"
                className={`toggle-option${!data.useEstimatedHourlyCost ? ' selected' : ''}`}
                onClick={() => set('useEstimatedHourlyCost', false)}
              >
                Ingresar valor real
              </button>
            </div>
            {!data.useEstimatedHourlyCost && (
              <NumberField
                label="Costo por hora del equipo"
                value={data.hourlyTeamCost}
                onChange={v => set('hourlyTeamCost', v)}
                placeholder="ej. 100"
                prefix={currency === 'OTHER' ? customCurrency : currency === 'PEN' ? 'S/' : currency === 'EUR' ? '€' : '$'}
                hint="Costo promedio ponderado del equipo involucrado"
              />
            )}
          </div>
        </div>
      </div>

      {/* Live calculation preview */}
      <div className="card" style={{ marginTop: 16, background: 'linear-gradient(135deg, #001d6c 0%, #0f3460 100%)', color: '#fff' }}>
        <div className="card-title" style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 10, marginBottom: 16 }}>
          Estimación actual de costo de war rooms
          <span className="badge badge-teal" style={{ marginLeft: 'auto' }}>Cálculo en vivo</span>
        </div>
        <div className="grid-3">
          <div className="roi-highlight">
            <div className="roi-value" style={{ fontSize: 28 }}>{formatNumber(warRoom.monthlyManHours, 0)}</div>
            <div className="roi-label">Horas hombre / mes</div>
          </div>
          <div className="roi-highlight">
            <div className="roi-value" style={{ fontSize: 28 }}>{fmt(warRoom.monthlyCost)}</div>
            <div className="roi-label">Costo mensual war rooms</div>
          </div>
          <div className="roi-highlight">
            <div className="roi-value" style={{ fontSize: 28 }}>{fmt(warRoom.annualCost)}</div>
            <div className="roi-label">Costo anual war rooms</div>
          </div>
        </div>
        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 12, textAlign: 'center' }}>
          Fórmula: incidentes/mes × duración × personas × costo/hora. Solo simulación.
        </p>
      </div>
    </div>
  );
}
