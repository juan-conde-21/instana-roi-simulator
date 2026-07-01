# Modelo referencial de costo Instana

## Alcance

Este modelo cubre exclusivamente IBM Instana Distributed para entornos distribuidos: aplicaciones, servicios, hosts, contenedores, Kubernetes y telemetria distribuida.

No incluye z/OS, mainframe, MSU, VU, IBM Observability by Instana APM on z/OS, PID ESW, ShopZ, Workload Pricer ni ningun calculo asociado a mainframe.

## Naturaleza referencial

El estimador no es una cotizacion oficial. Los precios unitarios, minimos, fair use, Resource Units y descuentos son editables desde la UI y deben validarse con una cotizacion oficial antes de presentarse como propuesta comercial.

## Modos

### Modo manual

El usuario ingresa el costo anual estimado de Instana. Este modo conserva compatibilidad con datos existentes y alimenta el ROI como antes.

### Modo detallado

El usuario calcula el costo desde variables de pricing referenciales:

- Deployment: SaaS o Self-Hosted / On-Premise.
- Linea Standard / APM: MVS, precio mensual unitario y meses.
- Linea Essentials / IQM: MVS, precio mensual unitario y meses.
- Add-ons opcionales: Data Ingest, Logs in Context, Synthetic Monitoring / Managed PoP.
- Servicios: implementacion, capacitacion, servicios profesionales, operacion interna.
- Descuento o ajuste comercial referencial.
- Coexistencia o transicion si aplica.

## Formulas

### Base

```text
standardCost = standardMvsQty x standardMonthlyUnitPrice x standardMonths
essentialsCost = essentialsMvsQty x essentialsMonthlyUnitPrice x essentialsMonths
baseInstanaCost = standardCost + essentialsCost
discountedBaseCost = baseInstanaCost x (1 - discountPercent / 100)
```

### Data Ingest / Fair Use

Para SaaS con calculo automatico:

```text
includedFairUseGb = standardMvsQty x fairUseGbPerStandardMvs + essentialsMvsQty x fairUseGbPerEssentialsMvs
monthlyDataIngestOverageGb = max(0, expectedMonthlyDataIngestGb - includedFairUseGb - dataIngestAddonGb)
dataIngestAddonMonthlyCost = dataIngestAddonGb x dataIngestAddonUnitPricePerGb
dataIngestOverageMonthlyCost = monthlyDataIngestOverageGb x dataIngestOnDemandPricePerGb
dataIngestTotalCost = (dataIngestAddonMonthlyCost + dataIngestOverageMonthlyCost) x months
```

### Logs in Context

Para SaaS:

```text
logsUnits = ceil(logsMonthlyGb / logsUnitSizeGb)
logsMonthlyCost = logsUnits x logsUnitPriceMonthly
logsOverageCost = ceil(logsOverageGb / logsOverageUnitSizeGb) x logsOverageUnitPrice
logsTotalCost = (logsMonthlyCost + logsOverageCost) x months
```

Para Self-Hosted el costo por defecto es 0 si se considera incluido. El usuario puede ingresar un costo manual para reflejar infraestructura o esfuerzo adicional.

### Synthetic Monitoring / Managed PoP

Managed PoP solo aplica cuando el deployment es SaaS y la ejecucion es IBM Hosted Public PoP.

```text
simpleApiRu = simpleApiTests x simpleApiExecutionsPerMonth x ruPerSimpleApiExecution
apiScriptRu = apiScriptTests x apiScriptExecutionsPerMonth x ruPerApiScriptExecution
browserRu = browserTests x browserExecutionsPerMonth x ruPerBrowserExecution
totalRuMonthly = simpleApiRu + apiScriptRu + browserRu
purchasedRuUnits = max(minimumRuUnitsMonthly, ceil(totalRuMonthly / ruUnitSize))
syntheticMonthlyCost = purchasedRuUnits x ruUnitPriceMonthly
syntheticTotalCost = syntheticMonthlyCost x months
```

Si se usa Customer Private PoP o Self-Hosted, no se agrega costo Managed PoP salvo un override manual opcional.

### Total

```text
totalHorizon = discountedBaseCost + dataIngestCost + logsCost + syntheticCost + servicesCost + operationCost + coexistenceTransitionCost
totalAnnual = totalHorizon / (months / 12)
totalMonthly = totalHorizon / months
```


## Salida para ReportModel y exportables

`ReportModel` expone `instanaCostModel` con los totales calculados y `instanaCostRows` con filas legibles para UI, PDF y Excel. Las filas incluyen modo, fuente del costo, deployment, MVS, precios unitarios, meses, descuento, fair use, overage, retencion, unidades de logs, RU synthetic, servicios profesionales, operacion interna, coexistencia/transicion, advertencias y supuestos.

En modo manual, las filas no muestran lineas Standard/Essentials ni add-ons detallados para evitar mezclar valores residuales del modo detallado. En modo detallado, el costo manual previo no se usa para ROI.

## Supuestos configurables

- Minimo MVS por linea: default 10.
- Minimo opcional para escenarios 100% serverless u OpenTelemetry: default 50.
- Fair use GB por Standard MVS y Essentials MVS.
- Unidad de logs y unidad de overage.
- RU por ejecucion synthetic y unidad RU.
- Minimo mensual de unidades RU.
- Precios unitarios, descuentos y meses.

Los valores sample viven en `src/data/pricingConfig.ts` con disclaimer de uso referencial.

## Validaciones

- `instana_cost_zero`: debe existir costo manual o calculado.
- `mvs_below_minimum`: cantidad MVS por debajo del minimo referencial.
- `high_discount`: descuento mayor a 30%.
- `data_ingest_over_fair_use`: consumo esperado supera fair use estimado.
- `logs_addon_not_applicable_self_hosted`: add-on SaaS de logs no aplica directamente a Self-Hosted.
- `synthetic_managed_pop_not_applicable`: Managed PoP no aplica para PoP privado o Self-Hosted.
- `pricing_reference_only`: nota permanente de estimacion referencial.

## Conexion con ROI

El motor ROI usa `calculateInstanaCostBreakdown()`:

- En modo manual usa el costo anual manual y conserva compatibilidad.
- En modo detallado usa el total anual equivalente calculado desde el horizonte del estimador.

`ReportModel` expone `instanaCostModel` e `instanaCostRows`. PDF y Excel consumen ese modelo y no recalculan el costo.
