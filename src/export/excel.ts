import * as XLSX from 'xlsx';
import type { ReportModel } from '../engine/reportModel';

const SEVERITY_ES: Record<string, string> = {
  critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo',
};
const CATEGORY_ES: Record<string, string> = {
  cost: 'Costo', benefit: 'Beneficio', data: 'Datos', transition: 'Transición', context: 'Contexto',
};

export function exportToExcel(model: ReportModel) {
  const { state, interpretation, reading } = model;
  const wb = XLSX.utils.book_new();

  const sc = model.scenarios;

  // ─── Hoja 1: Resumen ejecutivo ─────────────────────────────────────────────
  const summary = [
    ['SIMULADOR ROI – IBM INSTANA', '', '', ''],
    ['Herramienta consultiva de preventa · Solo simulación', '', '', ''],
    ['', '', '', ''],
    ['CLIENTE', model.clientName, '', ''],
    ['INDUSTRIA', model.industryLabel, '', ''],
    ['MONEDA', model.currencyCode, '', ''],
    ['HORIZONTE', model.horizonLabel, '', ''],
    ['PUNTO DE PARTIDA', model.startingPointLabel, '', ''],
    ['DRIVER DE EVALUACIÓN', model.evalDriverLabel, '', ''],
    ['FECHA', model.date, '', ''],
    ['', '', '', ''],
    ['INDICADOR', 'CONSERVADOR', 'ESPERADO', 'OPTIMISTA'],
    ['ROI (%)', sc.conservative.roiFormatted, sc.expected.roiFormatted, sc.optimistic.roiFormatted],
    ['Payback', sc.conservative.paybackFormatted, sc.expected.paybackFormatted, sc.optimistic.paybackFormatted],
    ['Beneficio anual estimado', sc.conservative.totalAnnualBenefitFormatted, sc.expected.totalAnnualBenefitFormatted, sc.optimistic.totalAnnualBenefitFormatted],
    ['Beneficio neto anual', sc.conservative.netAnnualBenefitFormatted, sc.expected.netAnnualBenefitFormatted, sc.optimistic.netAnnualBenefitFormatted],
    ['TCO actual anual', model.currentAnnualCostFormatted, '', ''],
    ['Costo Instana anual', model.instanaAnnualCostFormatted, '', ''],
    ['', '', '', ''],
    ['CONFIANZA', `${model.confidenceLevelShort} — ${Math.round(model.dataCompleteness)}% datos reales`, '', ''],
    ['', '', '', ''],
    ['─── LECTURA DEL RESULTADO ───────────────────────────────', '', '', ''],
    ['', '', '', ''],
    ['RESUMEN EJECUTIVO (escenario esperado)', '', '', ''],
    [reading.narrativeParagraph, '', '', ''],
    ['', '', '', ''],
    [reading.isNegative ? 'POR QUÉ EL ROI ES NEGATIVO' : 'POR QUÉ EL ROI ES POSITIVO', '', '', ''],
    [reading.explanation, '', '', ''],
    ['', '', '', ''],
    ['RECOMENDACIÓN CONSULTIVA', '', '', ''],
    ...reading.recommendations.map((r, i) => [`${i + 1}. ${r}`, '', '', '']),
    ['', '', '', ''],
    ['ADVERTENCIA', 'Estos resultados son estimaciones simuladas bajo supuestos del sector. No representan garantías ni compromisos comerciales de IBM o Instana.', '', ''],
    ['NOTA', 'Esta lectura fue generada automáticamente. Debe ser revisada por el consultor antes de presentarla al cliente.', '', ''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summary);
  ws1['!cols'] = [{ wch: 50 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen ejecutivo');

  // ─── Hoja 2: Datos de entrada ──────────────────────────────────────────────
  const inputs = [
    ['SECCIÓN', 'CAMPO', 'VALOR'],
    ...model.inputRows.map(r => [r.section, r.field, r.value]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(inputs);
  ws2['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Datos de entrada');

  // ─── Hoja 3: Supuestos ─────────────────────────────────────────────────────
  const assumptionsHeader = model.assumptionsCustomized
    ? '⚠ SUPUESTOS PERSONALIZADOS POR EL CONSULTOR – Valores por defecto fueron modificados'
    : 'SUPUESTOS DE SIMULACIÓN – VALORES POR DEFECTO (editables en el simulador)';
  const assumptions = [
    [assumptionsHeader, '', '', '', ''],
    ['NOTA: Estos porcentajes son supuestos de simulación. No representan garantías de mejora de IBM o Instana.', '', '', '', ''],
    ['', '', '', '', ''],
    ['PARÁMETRO', 'CONSERVADOR MIN%', 'CONSERVADOR MAX%', 'ESPERADO MIN%', 'ESPERADO MAX%'],
    ['Reducción MTTR', ...state.scenariosConfig.conservative.mttrReduction, ...state.scenariosConfig.expected.mttrReduction],
    ['Reducción MTTD', ...state.scenariosConfig.conservative.mttdReduction, ...state.scenariosConfig.expected.mttdReduction],
    ['Reducción war rooms', ...state.scenariosConfig.conservative.warRoomReduction, ...state.scenariosConfig.expected.warRoomReduction],
    ['Reducción administración', ...state.scenariosConfig.conservative.adminReduction, ...state.scenariosConfig.expected.adminReduction],
    ['Mejora cobertura', ...state.scenariosConfig.conservative.coverageImprovement, ...state.scenariosConfig.expected.coverageImprovement],
    ['Reducción fragmentación', ...state.scenariosConfig.conservative.fragmentationReduction, ...state.scenariosConfig.expected.fragmentationReduction],
    ['', '', '', '', ''],
    ['PARÁMETRO', 'OPTIMISTA MIN%', 'OPTIMISTA MAX%', '', ''],
    ['Reducción MTTR', ...state.scenariosConfig.optimistic.mttrReduction, '', ''],
    ['Reducción MTTD', ...state.scenariosConfig.optimistic.mttdReduction, '', ''],
    ['Reducción war rooms', ...state.scenariosConfig.optimistic.warRoomReduction, '', ''],
    ['Reducción administración', ...state.scenariosConfig.optimistic.adminReduction, '', ''],
    ['Mejora cobertura', ...state.scenariosConfig.optimistic.coverageImprovement, '', ''],
    ['Reducción fragmentación', ...state.scenariosConfig.optimistic.fragmentationReduction, '', ''],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(assumptions);
  ws3['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Supuestos');

  // ─── Hoja 4: Cálculos ─────────────────────────────────────────────────────
  const calcs = [
    ['CÁLCULOS DETALLADOS', '', '', ''],
    ['', '', '', ''],
    ['WAR ROOMS', '', '', ''],
    ['Horas hombre mensuales', model.warRoomMonthlyManHours.toFixed(1), '', ''],
    ['Costo mensual', model.warRoomMonthlyCostFormatted, '', ''],
    ['Costo anual', model.warRoomAnnualCostFormatted, '', ''],
    ['Costo/hora equipo usado', model.warRoomHourlyCostFormatted, '', ''],
    ['', '', '', ''],
    ['COSTOS ANUALES', '', '', ''],
    ['TCO actual (estimado)', model.currentAnnualCostFormatted, '', ''],
    ['Costo Instana anual', model.instanaAnnualCostFormatted, '', ''],
    ['', '', '', ''],
    ['DESGLOSE DE AHORROS', 'CONSERVADOR', 'ESPERADO', 'OPTIMISTA'],
    ['War rooms', sc.conservative.warRoomSavingsFormatted, sc.expected.warRoomSavingsFormatted, sc.optimistic.warRoomSavingsFormatted],
    ['Administración', sc.conservative.adminSavingsFormatted, sc.expected.adminSavingsFormatted, sc.optimistic.adminSavingsFormatted],
    ['Infraestructura', sc.conservative.infraSavingsFormatted, sc.expected.infraSavingsFormatted, sc.optimistic.infraSavingsFormatted],
    ['Racionalización APM', sc.conservative.apmRationalizationSavingsFormatted, sc.expected.apmRationalizationSavingsFormatted, sc.optimistic.apmRationalizationSavingsFormatted],
    ['Valor cobertura recuperada', sc.conservative.coverageValueFormatted, sc.expected.coverageValueFormatted, sc.optimistic.coverageValueFormatted],
    ['Fragmentación', sc.conservative.fragmentationSavingsFormatted, sc.expected.fragmentationSavingsFormatted, sc.optimistic.fragmentationSavingsFormatted],
    ['Telemetría', sc.conservative.telemetrySavingsFormatted, sc.expected.telemetrySavingsFormatted, sc.optimistic.telemetrySavingsFormatted],
    ['TOTAL BENEFICIO ANUAL', sc.conservative.totalAnnualBenefitFormatted, sc.expected.totalAnnualBenefitFormatted, sc.optimistic.totalAnnualBenefitFormatted],
    ['', '', '', ''],
    ['TCO COMPARATIVO A 36 MESES', 'ACTUAL', 'CON INSTANA', ''],
    ['12 meses', sc.expected.tcoCurrentYear1Formatted, sc.expected.tco12Formatted, ''],
    ['24 meses', sc.expected.tcoCurrentYear1And2Formatted, sc.expected.tco24Formatted, ''],
    ['36 meses', sc.expected.tcoCurrentYear1To3Formatted, sc.expected.tco36Formatted, ''],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(calcs);
  ws4['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Cálculos');

  // ─── Hoja 5: Escenarios ────────────────────────────────────────────────────
  const scenarios = [
    ['ESCENARIOS DE ROI', 'CONSERVADOR', 'ESPERADO', 'OPTIMISTA'],
    ['ROI (%)', sc.conservative.roiFormatted, sc.expected.roiFormatted, sc.optimistic.roiFormatted],
    ['Payback (formateado)', sc.conservative.paybackFormatted, sc.expected.paybackFormatted, sc.optimistic.paybackFormatted],
    ['Beneficio anual', sc.conservative.totalAnnualBenefitFormatted, sc.expected.totalAnnualBenefitFormatted, sc.optimistic.totalAnnualBenefitFormatted],
    ['Costo Instana anual', sc.conservative.totalAnnualCostInstanaFormatted, sc.expected.totalAnnualCostInstanaFormatted, sc.optimistic.totalAnnualCostInstanaFormatted],
    ['Beneficio neto', sc.conservative.netAnnualBenefitFormatted, sc.expected.netAnnualBenefitFormatted, sc.optimistic.netAnnualBenefitFormatted],
    ['TCO 12m actual', sc.conservative.tcoCurrentYear1Formatted, sc.expected.tcoCurrentYear1Formatted, sc.optimistic.tcoCurrentYear1Formatted],
    ['TCO 12m Instana', sc.conservative.tco12Formatted, sc.expected.tco12Formatted, sc.optimistic.tco12Formatted],
    ['TCO 36m actual', sc.conservative.tcoCurrentYear1To3Formatted, sc.expected.tcoCurrentYear1To3Formatted, sc.optimistic.tcoCurrentYear1To3Formatted],
    ['TCO 36m Instana', sc.conservative.tco36Formatted, sc.expected.tco36Formatted, sc.optimistic.tco36Formatted],
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(scenarios);
  ws5['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'Escenarios');

  // ─── Hoja 6: Scores — from model.scores (Spanish labels, consistent with UI/PDF) ─
  const scoresData = [
    ['SCORES', 'VALOR (0-100)', 'INTERPRETACIÓN'],
    ...model.scores.map(s => [s.label, String(s.valueRounded), s.interpretation]),
  ];
  const ws6 = XLSX.utils.aoa_to_sheet(scoresData);
  ws6['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws6, 'Scores');

  // ─── Hoja 7: Interpretación del resultado ────────────────────────────────
  const statusLabels: Record<string, string> = {
    positive: 'ROI positivo',
    negative_valid: 'ROI negativo válido',
    negative_transition: 'Impactado por transición',
    negative_insufficient_data: 'Datos insuficientes',
    requires_review: 'Requiere revisión',
  };
  const interpData: (string | number)[][] = [
    ['INTERPRETACIÓN DEL RESULTADO ROI', '', ''],
    ['', '', ''],
    ['ESTADO DEL ROI', statusLabels[interpretation.status] ?? interpretation.status, ''],
    ['BADGE', interpretation.badgeLabel, ''],
    ['', '', ''],
    ['TITULAR', interpretation.headline, ''],
    ['', '', ''],
    ['CONTEXTO', interpretation.context, ''],
    ['', '', ''],
    ['RESUMEN NARRATIVO', interpretation.narrativeSummary, ''],
    ['', '', ''],
    ['ROI POR ESCENARIO', 'VALOR', '¿POSITIVO?'],
    ['Conservador', sc.conservative.roiFormatted, sc.conservative.isPositive ? 'Sí' : 'No'],
    ['Esperado', sc.expected.roiFormatted, sc.expected.isPositive ? 'Sí' : 'No'],
    ['Optimista', sc.optimistic.roiFormatted, sc.optimistic.isPositive ? 'Sí' : 'No'],
    ['', '', ''],
    ['FACTORES QUE IMPACTAN EL RESULTADO', 'IMPACTO', 'CATEGORÍA'],
    ...interpretation.drivers.map(d => [d.label, SEVERITY_ES[d.severity] ?? d.severity, CATEGORY_ES[d.category] ?? d.category]),
    ['', '', ''],
    ['DETALLE DE FACTORES', '', ''],
    ...interpretation.drivers.map(d => [`[${SEVERITY_ES[d.severity] ?? d.severity}] ${d.label}`, d.description, d.value ?? '']),
    ['', '', ''],
    ['DATOS A VALIDAR CON EL CLIENTE', '', ''],
    ...interpretation.validationSuggestions.map((s, i) => [`${i + 1}. ${s}`, '', '']),
    ['', '', ''],
    ['ACCIONES PARA FORTALECER EL CASO DE NEGOCIO', '', ''],
    ...interpretation.improvementActions.map((a, i) => [`${i + 1}. ${a}`, '', '']),
    ['', '', ''],
    ['NOTA', 'Esta interpretación fue generada automáticamente por el simulador. Debe ser revisada por el consultor antes de presentarla al cliente.', ''],
  ];
  const ws7 = XLSX.utils.aoa_to_sheet(interpData);
  ws7['!cols'] = [{ wch: 40 }, { wch: 60 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws7, 'Interpretación ROI');

  // ─── Hoja 8: Recomendación ────────────────────────────────────────────────
  const rec = [
    ['RECOMENDACIÓN CONSULTIVA', ''],
    ['', ''],
    ['Este reporte es una simulación para apoyo en procesos de preventa.', ''],
    ['Los resultados deben interpretarse en contexto y no como compromisos comerciales de IBM o Instana.', ''],
    ['Todos los valores son estimados bajo supuestos del sector y los datos ingresados en el simulador.', ''],
    ['', ''],
    ['PRÓXIMOS PASOS SUGERIDOS', ''],
    ...reading.recommendations.map((r, i) => [`${i + 1}. ${r}`, '']),
    ['', ''],
    ['PASOS ADICIONALES', ''],
    ['Solicitar cotización oficial de Instana para reemplazar los estimados del simulador.', ''],
    ['Realizar un workshop técnico para evaluar casos de uso específicos con el equipo del cliente.', ''],
    ['Definir métricas de éxito y KPIs previo a la implementación.', ''],
    ['', ''],
    ['TIPOS DE ROI IDENTIFICADOS', ''],
    ...model.activeRoiTypeLabels.map(lbl => [lbl, '✓']),
    ['', ''],
    ['VARIABLES CLAVE QUE IMPACTAN EL RESULTADO', ''],
    ...reading.sensitiveVars.map(sv => [sv.label, sv.value]),
    ['', ''],
    ['NOTA LEGAL', ''],
    ['Esta simulación fue generada con el Simulador ROI de IBM Instana.', ''],
    ['No representa una oferta comercial oficial de IBM o Instana.', ''],
    ['Los resultados dependen de los datos ingresados y los supuestos aplicados por el simulador.', ''],
    ['Esta lectura fue generada automáticamente y debe ser revisada por el consultor antes de presentarla.', ''],
  ];
  const ws8 = XLSX.utils.aoa_to_sheet(rec);
  ws8['!cols'] = [{ wch: 60 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws8, 'Recomendación');


  // ─── Hoja: Costo Instana ─────────────────────────────────────────────────
  const instanaCost = [
    ['ESTIMACION REFERENCIAL DE COSTO INSTANA', '', ''],
    ['NOTA', 'Estimacion referencial. No reemplaza cotizacion oficial.', ''],
    ['ALCANCE', 'Instana Distributed only. No incluye mainframe, z/OS, MSU, VU, ShopZ ni Workload Pricer.', ''],
    ['', '', ''],
    ['CAMPO', 'VALOR', 'DETALLE'],
    ...model.instanaCostRows.map(r => [r.field, r.value, r.section]),
  ];
  const wsCost = XLSX.utils.aoa_to_sheet(instanaCost);
  wsCost['!cols'] = [{ wch: 36 }, { wch: 48 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsCost, 'Costo Instana');

  // ─── Guardar ───────────────────────────────────────────────────────────────
  const filename = `ROI_Instana_${(state.profile.clientName || 'escenario').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
