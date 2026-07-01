# Release Notes

## v0.5.1-rc.1 — Release candidate local

Fecha: 2026-07-01

## Funcionalidades principales

- Simulador ROI consultivo para IBM Instana en escenarios de observabilidad distribuida.
- Wizard de captura para perfil, alcance, incidentes, bloques opcionales y costos Instana.
- Motor de ROI con escenarios conservador, esperado y optimista.
- Interpretacion consultiva de ROI positivo, negativo, transicion y datos insuficientes.
- Validaciones de consistencia y panel de alertas.
- Editor de supuestos de escenarios.

## Pricing Instana

- Estimador referencial de costo Instana con modo manual y modo detallado.
- Soporte para SaaS y Self-Hosted / On-Premise.
- Lineas Standard / APM y Essentials / IQM con MVS, precio mensual unitario y meses editables.
- Add-ons referenciales: Data Ingest / Fair Use, Logs in Context y Synthetic Monitoring / Managed PoP.
- Servicios profesionales, implementacion, capacitacion, operacion interna y coexistencia/transicion.
- Advertencias para descuentos altos, MVS bajo minimo, overage de data ingest y no aplicabilidad de add-ons.

## Exportables

- Excel con hojas de resumen, datos de entrada, supuestos, calculos, escenarios, scores, interpretacion, recomendacion y Costo Instana.
- PDF ejecutivo con resumen, lectura del resultado, graficos vectoriales, costos, pricing Instana, supuestos, interpretacion y notas.
- PDF y Excel consumen `ReportModel`; no recalculan pricing ni ROI.

## Tests y build

- 238 tests pasando en 10 archivos.
- `npm run build` limpio, 0 errores TypeScript.
- Warning conocido: chunk grande `vendor-charts` por Recharts.

## Limitaciones conocidas

- Los resultados son una simulacion consultiva basada en datos ingresados y supuestos editables.
- No representa garantia financiera, compromiso comercial ni cotizacion oficial de IBM o Instana.
- Los precios unitarios son referenciales y deben validarse con una cotizacion oficial.
- El PDF se valida por contrato de modelo y build; no hay prueba visual automatizada pagina por pagina.
- Recharts permanece en un chunk grande cargado por el dashboard.

## Exclusiones explicitas

Este release candidate cubre Instana Distributed only. No implementa ni calcula mainframe, z/OS, MSU, VU, IBM Observability by Instana APM on z/OS, PID ESW, ShopZ ni Workload Pricer.

## Seguridad de publicacion

- No incluir presentaciones internas, material IBM Sellers & Partners ni archivos privados de pricing.
- `.gitignore` excluye dependencias, build, variables de entorno, pricing local/privado, exportables generados y materiales internos.
