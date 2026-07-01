import type { ProfileSection } from '../../types';
import { SelectField, TextField, ToggleGroup } from '../UI/FormField';
import HelpTooltip from '../UI/HelpTooltip';
import { helpTexts } from '../../content/helpTexts';

interface Props {
  data: ProfileSection;
  onChange: (d: ProfileSection) => void;
}

const INDUSTRIES = [
  { value: 'banking', label: 'Banca / Finanzas' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'retail', label: 'Retail / eCommerce' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'government', label: 'Gobierno' },
  { value: 'health', label: 'Salud' },
  { value: 'education', label: 'Educación' },
  { value: 'manufacturing', label: 'Manufactura / Industria' },
  { value: 'tech', label: 'Tecnología / SaaS' },
  { value: 'other', label: 'Otro' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD – Dólar americano' },
  { value: 'PEN', label: 'PEN – Sol peruano' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'OTHER', label: 'Otra' },
];

const HORIZONS = [
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
  { value: '36', label: '36 meses' },
];

const STARTING_POINTS = [
  { value: 'no_apm', label: 'Sin APM' },
  { value: 'basic_monitoring', label: 'Monitoreo básico' },
  { value: 'commercial_apm', label: 'APM comercial' },
  { value: 'open_source', label: 'Open source' },
  { value: 'multiple_tools', label: 'Varias herramientas' },
  { value: 'unknown', label: 'No sabe' },
];

const EVAL_DRIVERS = [
  { value: 'cost_excessive', label: 'Costo excesivo del APM actual' },
  { value: 'unpredictable_consumption', label: 'Consumo impredecible' },
  { value: 'underutilized', label: 'No se usa el 100% de la herramienta' },
  { value: 'coverage_limited', label: 'Cobertura limitada por costo' },
  { value: 'war_rooms', label: 'Muchos war rooms' },
  { value: 'high_mttr', label: 'MTTR elevado' },
  { value: 'fragmented_tools', label: 'Herramientas fragmentadas' },
  { value: 'upcoming_renewal', label: 'Renovación próxima' },
  { value: 'otel_standardization', label: 'Estandarización con OpenTelemetry' },
  { value: 'need_more_coverage', label: 'Necesidad de mayor cobertura' },
  { value: 'other', label: 'Otro' },
];

export default function Step1Profile({ data, onChange }: Props) {
  const set = <K extends keyof ProfileSection>(key: K, val: ProfileSection[K]) =>
    onChange({ ...data, [key]: val });

  return (
    <div>
      <div className="section-header">
        <div className="section-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2>Perfil del cliente</h2>
      </div>

      <div className="notice notice-info" style={{ marginBottom: 16 }}>
        Esta herramienta es un simulador consultivo. Los resultados son estimaciones basadas en supuestos del sector.
        No representan promesas ni compromisos comerciales.
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-title">Identificación</div>
          <TextField
            label="Nombre del cliente o escenario"
            value={data.clientName}
            onChange={v => set('clientName', v)}
            placeholder="ej. Banco Ejemplo S.A."
          />
          <SelectField
            label="Industria"
            value={data.industry}
            onChange={v => set('industry', v as ProfileSection['industry'])}
            options={INDUSTRIES}
            help={helpTexts.profile.industry}
          />
          <div className="grid-2">
            <SelectField
              label="Moneda"
              value={data.currency}
              onChange={v => set('currency', v as ProfileSection['currency'])}
              options={CURRENCIES}
              help={helpTexts.profile.currency}
            />
            {data.currency === 'OTHER' && (
              <TextField
                label="Símbolo de moneda"
                value={data.customCurrency}
                onChange={v => set('customCurrency', v)}
                placeholder="ej. COP"
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Contexto de evaluación</div>
          <ToggleGroup
            label="Horizonte de análisis"
            value={String(data.horizon)}
            onChange={v => set('horizon', parseInt(v) as ProfileSection['horizon'])}
            options={HORIZONS}
            help={helpTexts.profile.horizon}
          />

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Punto de partida principal</label>
              <HelpTooltip content={helpTexts.profile.startingPoint} />
            </div>
            <div className="notice notice-info" style={{ marginBottom: 8 }}>
              Selección única. Describe la situación actual dominante del cliente.
            </div>
            <div className="toggle-group">
              {STARTING_POINTS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`toggle-option${data.startingPoint === o.value ? ' selected' : ''}`}
                  onClick={() => set('startingPoint', o.value as ProfileSection['startingPoint'])}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div className="card-title" style={{ margin: 0 }}>Driver principal de evaluación</div>
          <HelpTooltip content={helpTexts.profile.evalDriver} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--ibm-text-secondary)', marginBottom: 12 }}>
          ¿Cuál es la principal razón por la que el cliente evalúa Instana?
        </p>
        <div className="toggle-group">
          {EVAL_DRIVERS.map(o => (
            <button
              key={o.value}
              type="button"
              className={`toggle-option${data.evalDriver === o.value ? ' selected' : ''}`}
              onClick={() => set('evalDriver', o.value as ProfileSection['evalDriver'])}
            >
              {o.label}
            </button>
          ))}
        </div>
        {data.evalDriver === 'other' && (
          <div style={{ marginTop: 12 }}>
            <TextField
              label="Especificar driver"
              value={data.evalDriverOther}
              onChange={v => set('evalDriverOther', v)}
              placeholder="Describe el driver principal"
            />
          </div>
        )}
      </div>
    </div>
  );
}
