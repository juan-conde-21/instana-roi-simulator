import type { InstanaCosts, InstanaDeploymentModel, InstanaMonthOption, SyntheticExecutionLocation } from '../../types';
import { FormField, NumberField, SelectField, TextField, ToggleGroup } from '../UI/FormField';
import type { Currency } from '../../types';
import { formatCurrency } from '../../utils/format';
import { helpTexts } from '../../content/helpTexts';
import { calculateInstanaCostBreakdown } from '../../engine/instanaPricing';

interface Props {
  data: InstanaCosts;
  onChange: (d: InstanaCosts) => void;
  currency: Currency;
  customCurrency: string;
}

const yn = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
];

function SwitchField({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <FormField label={label} help={help}>
      <label className="checkbox-item" style={{ maxWidth: 260 }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        {checked ? 'Activado' : 'Desactivado'}
      </label>
    </FormField>
  );
}

export default function Step5InstanaCosts({ data, onChange, currency, customCurrency }: Props) {
  const set = <K extends keyof InstanaCosts>(key: K, val: InstanaCosts[K]) => onChange({ ...data, [key]: val });
  const sym = currency === 'USD' ? '$' : currency === 'PEN' ? 'S/' : currency === 'EUR' ? '€' : customCurrency;
  const breakdown = calculateInstanaCostBreakdown(data, 12);
  const fmt = (v: number) => formatCurrency(v, currency, customCurrency);
  const detailed = data.costMode === 'detailed';
  const months = breakdown.months;

  const summaryRows = [
    ['Base Standard / APM', breakdown.standardCost],
    ['Base Essentials / IQM', breakdown.essentialsCost],
    ['Descuento aplicado', -breakdown.discountAmount],
    ['Data Ingest', breakdown.dataIngestCost],
    ['Logs in Context', breakdown.logsCost],
    ['Synthetic / Managed PoP', breakdown.syntheticCost],
    ['Implementación', breakdown.implementationCost],
    ['Capacitación', breakdown.trainingCost],
    ['Servicios profesionales', breakdown.professionalServicesCost],
    ['Operación interna', breakdown.operationCost],
    ['Coexistencia / transición', breakdown.coexistenceTransitionCost],
  ];

  return (
    <div>
      <div className="section-header">
        <div className="section-icon">$</div>
        <h2>Estimador referencial de costo Instana</h2>
      </div>

      <div className="notice notice-warning" style={{ marginBottom: 16 }}>
        Los valores son referenciales y editables. No reemplazan una cotización oficial. Alcance exclusivo: Instana Distributed; no incluye mainframe, z/OS, MSU, VU, ShopZ ni Workload Pricer.
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <ToggleGroup
          label="Modo de estimación"
          value={data.costMode}
          onChange={v => set('costMode', v)}
          options={[
            { value: 'manual', label: 'Ingresar costo manual' },
            { value: 'detailed', label: 'Calcular costo referencial' },
          ]}
          help={helpTexts.instanaCosts.precioReferencial}
        />
      </div>

      {!detailed && (
        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-title">Costo manual</div>
            <NumberField label="Costo anual estimado de Instana" value={data.annualLicenseCost} onChange={v => set('annualLicenseCost', v)} placeholder="ej. 180000" prefix={sym} help={helpTexts.instanaCosts.annualLicense} />
            <NumberField label="Costo de operación interna anual" value={data.internalOperationCost} onChange={v => set('internalOperationCost', v)} placeholder="ej. 24000" prefix={sym} help={helpTexts.instanaCosts.internalOperation} />
            <NumberField label="Costo adicional de logs (si aplica)" value={data.logsCost} onChange={v => set('logsCost', v)} placeholder="ej. 0" prefix={sym} help={helpTexts.instanaCosts.logsInContext} />
            <NumberField label="Costo de synthetic monitoring (si aplica)" value={data.syntheticCost} onChange={v => set('syntheticCost', v)} placeholder="ej. 0" prefix={sym} help={helpTexts.instanaCosts.managedPop} />
            <NumberField label="Otros componentes adicionales" value={data.additionalComponentsCost} onChange={v => set('additionalComponentsCost', v)} placeholder="ej. 0" prefix={sym} />
          </div>
          <ServicesCard data={data} set={set} sym={sym} />
        </div>
      )}

      {detailed && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card">
              <div className="card-title">Deployment y meses</div>
              <SelectField label="Deployment model" value={data.deploymentModel} onChange={v => set('deploymentModel', v as InstanaDeploymentModel)} options={[{ value: 'saas', label: 'SaaS' }, { value: 'self_hosted', label: 'Self-Hosted / On-Premise' }]} help={helpTexts.instanaCosts.deploymentModel} />
              <SelectField label="Meses de cálculo" value={String(data.monthOption)} onChange={v => set('monthOption', v === 'custom' ? 'custom' : Number(v) as InstanaMonthOption)} options={[{ value: '12', label: '12 meses' }, { value: '24', label: '24 meses' }, { value: '36', label: '36 meses' }, { value: 'custom', label: 'Custom' }]} />
              {data.monthOption === 'custom' && <NumberField label="Meses custom" value={data.customMonths} onChange={v => set('customMonths', v)} min={1} suffix="meses" />}
              <NumberField label="Mínimo MVS por línea" value={data.minimumMvsPerPartNumber} onChange={v => set('minimumMvsPerPartNumber', v ?? 10)} suffix="MVS" help={helpTexts.instanaCosts.mvs} />
              <SwitchField label="Caso 100% serverless u OpenTelemetry" checked={data.enforceServerlessOtelMinimum} onChange={v => set('enforceServerlessOtelMinimum', v)} />
              {data.enforceServerlessOtelMinimum && <NumberField label="Mínimo MVS serverless/OTel" value={data.serverlessOtelMinimumMvs} onChange={v => set('serverlessOtelMinimumMvs', v ?? 50)} suffix="MVS" />}
            </div>

            <div className="card">
              <div className="card-title">Edición / componente base</div>
              <NumberField label="Standard / APM MVS quantity" value={data.standardMvsQty} onChange={v => set('standardMvsQty', v)} suffix="MVS" help={helpTexts.instanaCosts.standardApm} />
              <NumberField label="Standard / APM monthly unit price" value={data.standardMonthlyUnitPrice} onChange={v => set('standardMonthlyUnitPrice', v)} prefix={sym} help={helpTexts.instanaCosts.precioReferencial} />
              <NumberField label="Standard / APM months" value={data.standardMonths} onChange={v => set('standardMonths', v)} suffix="meses" />
              <NumberField label="Essentials / IQM MVS quantity" value={data.essentialsMvsQty} onChange={v => set('essentialsMvsQty', v)} suffix="MVS" help={helpTexts.instanaCosts.essentialsIqm} />
              <NumberField label="Essentials / IQM monthly unit price" value={data.essentialsMonthlyUnitPrice} onChange={v => set('essentialsMonthlyUnitPrice', v)} prefix={sym} help={helpTexts.instanaCosts.precioReferencial} />
              <NumberField label="Essentials / IQM months" value={data.essentialsMonths} onChange={v => set('essentialsMonths', v)} suffix="meses" />
              <div className="notice notice-info">Los valores unitarios son referenciales y deben validarse con una cotización oficial.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Descuento o ajuste comercial</div>
            <div className="grid-2">
              <NumberField label="Descuento" value={data.discountPercent} onChange={v => set('discountPercent', v)} min={0} max={100} suffix="%" help={helpTexts.instanaCosts.descuento} />
              <TextField label="Motivo del descuento" value={data.discountReason} onChange={v => set('discountReason', v)} placeholder="Opcional" />
            </div>
          </div>

          <DataIngestCard data={data} set={set} sym={sym} />
          <LogsCard data={data} set={set} sym={sym} />
          <SyntheticCard data={data} set={set} sym={sym} />
          <ServicesCard data={data} set={set} sym={sym} />
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Resumen de costo Instana <span className="badge badge-teal">Referencial</span></div>
        <div className="grid-3">
          <div className="metric-card blue"><div className="metric-label">Total mensual estimado</div><div className="metric-value">{fmt(breakdown.totalMonthly)}</div></div>
          <div className="metric-card blue"><div className="metric-label">Total anual estimado</div><div className="metric-value">{fmt(breakdown.totalAnnual)}</div></div>
          <div className="metric-card blue"><div className="metric-label">Total para {months} meses</div><div className="metric-value">{fmt(breakdown.totalHorizon)}</div></div>
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          {summaryRows.map(([label, value]) => <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ibm-border)', paddingBottom: 6 }}><span>{label}</span><strong>{fmt(value as number)}</strong></div>)}
        </div>
        {breakdown.warnings.length > 0 && <div className="notice notice-warning" style={{ marginTop: 16 }}>{breakdown.warnings.join(' ')}</div>}
      </div>
    </div>
  );
}

function ServicesCard({ data, set, sym }: { data: InstanaCosts; set: <K extends keyof InstanaCosts>(key: K, val: InstanaCosts[K]) => void; sym: string }) {
  return <div className="card"><div className="card-title">Servicios profesionales</div>
    <div className="notice notice-info">Servicios profesionales: consultoría, integración y acompañamiento técnico.</div>
    <NumberField label="Costo de implementación" value={data.implementationCost} onChange={v => set('implementationCost', v)} prefix={sym} help={helpTexts.instanaCosts.implementation} />
    <NumberField label="Costo de capacitación" value={data.trainingCost} onChange={v => set('trainingCost', v)} prefix={sym} help={helpTexts.instanaCosts.training} />
    <NumberField label="Costo de servicios profesionales" value={data.professionalServicesCost} onChange={v => set('professionalServicesCost', v)} prefix={sym} help={helpTexts.instanaCosts.professionalServices} />
    <NumberField label="Operación interna anual" value={data.internalOperationCost} onChange={v => set('internalOperationCost', v)} prefix={sym} help={helpTexts.instanaCosts.internalOperation} />
    <NumberField label="Coexistencia / transición" value={data.coexistenceTransitionCost} onChange={v => set('coexistenceTransitionCost', v)} prefix={sym} />
  </div>;
}

function DataIngestCard({ data, set, sym }: { data: InstanaCosts; set: <K extends keyof InstanaCosts>(key: K, val: InstanaCosts[K]) => void; sym: string }) {
  return <div className="card"><div className="card-title">Data Ingest / Fair Use</div>
    <SwitchField label="Incluir Data Ingest" checked={data.includeDataIngestAddon} onChange={v => set('includeDataIngestAddon', v)} help={helpTexts.instanaCosts.dataIngest} />
    <div className="grid-2">
      <NumberField label="Expected monthly data ingest" value={data.expectedMonthlyDataIngestGb} onChange={v => set('expectedMonthlyDataIngestGb', v)} suffix="GB" />
      <ToggleGroup label="Calcular fair use automáticamente" value={data.calculateIncludedFairUseAutomatically ? 'yes' : 'no'} onChange={v => set('calculateIncludedFairUseAutomatically', v === 'yes')} options={yn} help={helpTexts.instanaCosts.fairUse} />
      {!data.calculateIncludedFairUseAutomatically && <NumberField label="Included fair use" value={data.includedFairUseGb} onChange={v => set('includedFairUseGb', v)} suffix="GB" />}
      <NumberField label="Fair use GB por Standard MVS" value={data.fairUseGbPerStandardMvs} onChange={v => set('fairUseGbPerStandardMvs', v ?? 0)} suffix="GB" />
      <NumberField label="Fair use GB por Essentials MVS" value={data.fairUseGbPerEssentialsMvs} onChange={v => set('fairUseGbPerEssentialsMvs', v ?? 0)} suffix="GB" />
      <NumberField label="Data ingest add-on GB" value={data.dataIngestAddonGb} onChange={v => set('dataIngestAddonGb', v)} suffix="GB" />
      <NumberField label="Precio add-on por GB" value={data.dataIngestAddonUnitPricePerGb} onChange={v => set('dataIngestAddonUnitPricePerGb', v)} prefix={sym} />
      <NumberField label="Overage on demand GB" value={data.dataIngestOnDemandOverageGb} onChange={v => set('dataIngestOnDemandOverageGb', v)} suffix="GB" />
      <NumberField label="Precio overage por GB" value={data.dataIngestOnDemandPricePerGb} onChange={v => set('dataIngestOnDemandPricePerGb', v)} prefix={sym} />
    </div>
    <div className="notice notice-warning">Evitar doble conteo. Validar si el volumen ingresado corresponde a data ingest general, logs u otro componente de la cotización.</div>
  </div>;
}

function LogsCard({ data, set, sym }: { data: InstanaCosts; set: <K extends keyof InstanaCosts>(key: K, val: InstanaCosts[K]) => void; sym: string }) {
  const selfHosted = data.deploymentModel === 'self_hosted';
  return <div className="card"><div className="card-title">Logs in Context</div>
    <SwitchField label="Incluir Logs in Context" checked={data.includeLogsAddon} onChange={v => set('includeLogsAddon', v)} help={helpTexts.instanaCosts.logsInContext} />
    {selfHosted && <div className="notice notice-info">Para Self-Hosted, Logs in Context puede tratarse como incluido según licencia. Validar sizing, infraestructura y habilitación.</div>}
    <div className="grid-2">
      {!selfHosted && <><NumberField label="Logs monthly GB" value={data.logsMonthlyGb} onChange={v => set('logsMonthlyGb', v)} suffix="GB" /><SelectField label="Retention" value={String(data.logsRetentionDays)} onChange={v => set('logsRetentionDays', Number(v) as 30 | 60 | 90)} options={[{ value: '30', label: '30 días' }, { value: '60', label: '60 días' }, { value: '90', label: '90 días' }]} help={helpTexts.instanaCosts.retention} /><NumberField label="Logs purchased units" value={data.logsPurchasedUnitsGb} onChange={v => set('logsPurchasedUnitsGb', v)} suffix="unidades" /><NumberField label="Logs unit size" value={data.logsUnitSizeGb} onChange={v => set('logsUnitSizeGb', v ?? 1000)} suffix="GB" /><NumberField label="Logs unit price monthly" value={data.logsUnitPriceMonthly} onChange={v => set('logsUnitPriceMonthly', v)} prefix={sym} /><NumberField label="Logs overage GB" value={data.logsOverageGb} onChange={v => set('logsOverageGb', v)} suffix="GB" /><NumberField label="Logs overage unit size" value={data.logsOverageUnitSizeGb} onChange={v => set('logsOverageUnitSizeGb', v ?? 10)} suffix="GB" /><NumberField label="Logs overage unit price" value={data.logsOverageUnitPrice} onChange={v => set('logsOverageUnitPrice', v)} prefix={sym} /></>}
      {selfHosted && <NumberField label="Costo manual Self-Hosted" value={data.logsManualCostOverride} onChange={v => set('logsManualCostOverride', v)} prefix={sym} />}
    </div>
  </div>;
}

function SyntheticCard({ data, set, sym }: { data: InstanaCosts; set: <K extends keyof InstanaCosts>(key: K, val: InstanaCosts[K]) => void; sym: string }) {
  return <div className="card"><div className="card-title">Synthetic Monitoring</div>
    <SwitchField label="Incluir Synthetic Monitoring" checked={data.includeSynthetic} onChange={v => set('includeSynthetic', v)} help={helpTexts.instanaCosts.resourceUnits} />
    <SelectField label="Execution location" value={data.syntheticExecutionLocation} onChange={v => set('syntheticExecutionLocation', v as SyntheticExecutionLocation)} options={[{ value: 'ibm_hosted_public_pop', label: 'IBM Hosted Public PoP' }, { value: 'customer_private_pop', label: 'Customer Private PoP' }, { value: 'self_hosted', label: 'Self-Hosted' }]} help={helpTexts.instanaCosts.managedPop} />
    <div className="grid-3">
      <NumberField label="Simple API tests" value={data.simpleApiTests} onChange={v => set('simpleApiTests', v)} />
      <NumberField label="Simple API executions/month" value={data.simpleApiExecutionsPerMonth} onChange={v => set('simpleApiExecutionsPerMonth', v)} />
      <NumberField label="RU per simple API" value={data.ruPerSimpleApiExecution} onChange={v => set('ruPerSimpleApiExecution', v ?? 1)} help={helpTexts.instanaCosts.resourceUnits} />
      <NumberField label="API script tests" value={data.apiScriptTests} onChange={v => set('apiScriptTests', v)} />
      <NumberField label="API script executions/month" value={data.apiScriptExecutionsPerMonth} onChange={v => set('apiScriptExecutionsPerMonth', v)} />
      <NumberField label="RU per API script" value={data.ruPerApiScriptExecution} onChange={v => set('ruPerApiScriptExecution', v ?? 10)} />
      <NumberField label="Browser tests" value={data.browserTests} onChange={v => set('browserTests', v)} />
      <NumberField label="Browser executions/month" value={data.browserExecutionsPerMonth} onChange={v => set('browserExecutionsPerMonth', v)} />
      <NumberField label="RU per browser" value={data.ruPerBrowserExecution} onChange={v => set('ruPerBrowserExecution', v ?? 50)} />
      <NumberField label="RU unit size" value={data.ruUnitSize} onChange={v => set('ruUnitSize', v ?? 1000)} />
      <NumberField label="RU unit price monthly" value={data.ruUnitPriceMonthly} onChange={v => set('ruUnitPriceMonthly', v)} prefix={sym} />
      <NumberField label="Minimum RU units monthly" value={data.minimumRuUnitsMonthly} onChange={v => set('minimumRuUnitsMonthly', v ?? 0)} />
    </div>
    {data.syntheticExecutionLocation !== 'ibm_hosted_public_pop' && <NumberField label="Costo manual opcional" value={data.syntheticManualCostOverride} onChange={v => set('syntheticManualCostOverride', v)} prefix={sym} />}
    <div className="notice notice-info">No se agrega costo Managed PoP cuando las ejecuciones se realizan desde PoPs propios o Self-Hosted.</div>
  </div>;
}
