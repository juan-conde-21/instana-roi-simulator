import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScenarioType } from '../types';
import type { ReportModel } from '../engine/reportModel';
import { formatNumber } from '../utils/format';
import { drawROIChart, drawTCOChart, drawSavingsChart, drawScoreChart } from './pdfCharts';

const IBM_BLUE  = [15, 98, 254]  as [number, number, number];
const IBM_DARK  = [0, 29, 108]   as [number, number, number];
const IBM_TEAL  = [8, 189, 186]  as [number, number, number];
const IBM_RED   = [218, 30, 40]  as [number, number, number];
const IBM_GREEN = [36, 161, 72]  as [number, number, number];
const IBM_YELLOW= [200, 146, 0]  as [number, number, number];
const IBM_ORANGE= [212, 90, 0]   as [number, number, number];
const GRAY      = [82, 82, 82]   as [number, number, number];
const LIGHT_GRAY= [244, 244, 244]as [number, number, number];
const WHITE     = [255, 255, 255]as [number, number, number];

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  critical: IBM_RED, high: IBM_ORANGE, medium: IBM_YELLOW, low: GRAY,
};

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  conservative: 'Conservador', expected: 'Esperado', optimistic: 'Optimista',
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  positive:                  IBM_GREEN,
  negative_valid:            IBM_YELLOW,
  negative_transition:       IBM_ORANGE,
  negative_insufficient_data:GRAY,
  requires_review:           IBM_RED,
};

// ─── Función principal ────────────────────────────────────────────────────────

export function exportToPDF(model: ReportModel) {
  const { state, results, interpretation, reading } = model;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const currency = state.profile.currency;
  let y = 0;

  // ── helpers de layout ─────────────────────────────────────────────────────

  const addPage = () => { doc.addPage(); y = 20; };

  const checkOverflow = (needed = 20) => {
    if (y + needed > 270) addPage();
  };

  const title = (text: string, size = 14) => {
    doc.setFontSize(size);
    doc.setTextColor(...IBM_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(text, 14, y);
    y += size * 0.6;
  };

  const subtitle = (text: string, size = 11) => {
    doc.setFontSize(size);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(text, 14, y);
    y += size * 0.5 + 3;
  };

  const hr = () => {
    doc.setDrawColor(...IBM_BLUE);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 4;
  };

  const kv = (lbl: string, value: string, color?: [number, number, number]) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(lbl + ':', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(color ?? ([22, 22, 22] as [number, number, number])));
    doc.text(value, 80, y);
    y += 6;
  };

  // Envuelve un gráfico con try/catch — si falla, añade nota y sigue.
  const safeChart = (fn: (doc: jsPDF, y: number, model: ReportModel) => number): number => {
    try {
      return fn(doc, y, model);
    } catch {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GRAY);
      doc.text('(Gráfico no disponible para este conjunto de datos.)', 14, y + 5);
      return y + 12;
    }
  };

  const lastTableY = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // ─── PORTADA ──────────────────────────────────────────────────────────────
  doc.setFillColor(...IBM_DARK);
  doc.rect(0, 0, 210, 80, 'F');
  doc.setFillColor(...IBM_BLUE);
  doc.rect(0, 80, 210, 4, 'F');
  doc.setFillColor(...IBM_TEAL);
  doc.rect(0, 84, 210, 2, 'F');

  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('Simulador ROI', 14, 30);
  doc.text('IBM Instana', 14, 44);
  doc.text('Observabilidad', 14, 58);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...IBM_TEAL as [number, number, number]);
  doc.text('Herramienta consultiva de preventa · Solo simulación', 14, 72);

  y = 100;
  doc.setFontSize(18);
  doc.setTextColor(...IBM_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(model.clientName, 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`${model.industryLabel} · ${model.currencyCode} · ${state.profile.horizon} meses`, 14, y);
  y += 7;
  doc.text(`Fecha: ${model.date}`, 14, y);
  y += 7;
  doc.text(`Punto de partida: ${model.startingPointLabel}`, 14, y);
  y += 15;

  // Aviso de simulación
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('⚠ AVISO: Este documento es una simulación consultiva basada en supuestos del sector.', 18, y + 7);
  doc.text('Los resultados no representan garantías ni compromisos comerciales de IBM o Instana.', 18, y + 13);
  y += 28;

  // Supuestos personalizados — aviso en portada si aplica
  if (model.assumptionsCustomized) {
    doc.setFillColor(200, 146, 0);
    doc.roundedRect(14, y, 182, 12, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 22, 22);
    doc.text('⚠  Este reporte utiliza supuestos personalizados por el consultor.', 18, y + 8);
    y += 18;
  }

  // Confidence strip
  const confColor = model.confidenceLevelKey === 'high' ? IBM_GREEN :
    model.confidenceLevelKey === 'medium' ? [241, 194, 27] as [number, number, number] : IBM_RED;
  doc.setFillColor(...confColor);
  doc.roundedRect(14, y, 182, 12, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Confianza: ${model.confidenceLevelShort} · ${Math.round(model.dataCompleteness)}% datos reales`,
    18, y + 8,
  );
  y += 18;

  // ─── RESUMEN EJECUTIVO ────────────────────────────────────────────────────
  addPage();
  title('Resumen ejecutivo', 16);
  hr();
  y += 2;

  const sc = model.scenarios;
  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Conservador', 'Esperado', 'Optimista']],
    body: [
      ['ROI (%)',                   sc.conservative.roiFormatted,              sc.expected.roiFormatted,              sc.optimistic.roiFormatted],
      ['Payback',                   sc.conservative.paybackFormatted,          sc.expected.paybackFormatted,          sc.optimistic.paybackFormatted],
      ['Beneficio anual estimado',  sc.conservative.totalAnnualBenefitFormatted, sc.expected.totalAnnualBenefitFormatted, sc.optimistic.totalAnnualBenefitFormatted],
      ['Beneficio neto anual',      sc.conservative.netAnnualBenefitFormatted, sc.expected.netAnnualBenefitFormatted, sc.optimistic.netAnnualBenefitFormatted],
      ['TCO actual anual',          model.currentAnnualCostFormatted,          '',                                    ''],
      ['Costo Instana anual',       model.instanaAnnualCostFormatted,          '',                                    ''],
    ],
    headStyles: { fillColor: IBM_DARK, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center' },
      2: { halign: 'center', fillColor: [208, 226, 255] as [number, number, number] },
      3: { halign: 'center' },
    },
  });
  y = lastTableY() + 10;

  // ─── GRÁFICO 1: ROI por escenario ─────────────────────────────────────────
  checkOverflow(58);
  y = safeChart(drawROIChart);

  // ─── LECTURA DEL RESULTADO ────────────────────────────────────────────────
  checkOverflow(30);
  title('Lectura del resultado', 13);
  hr();
  y += 2;

  const isNegativeROI = reading.isNegative;

  // Narrativa ejecutiva
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...IBM_DARK);
  doc.text('Resumen ejecutivo del escenario esperado', 14, y);
  y += 6;

  doc.setFillColor(244, 249, 255);
  checkOverflow(30);
  const summaryLines = doc.splitTextToSize(reading.narrativeParagraph, 178) as string[];
  const summaryH = summaryLines.length * 5 + 10;
  doc.roundedRect(14, y - 4, 182, summaryH, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 22, 22);
  doc.text(summaryLines, 18, y);
  y += summaryH + 4;

  // ROI positivo/negativo
  checkOverflow(30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(isNegativeROI ? IBM_YELLOW : IBM_GREEN));
  doc.text(isNegativeROI ? '⚠  Por qué el ROI es negativo' : '✓  Por qué el ROI es positivo', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const explLines = doc.splitTextToSize(reading.explanation, 180) as string[];
  doc.text(explLines, 16, y);
  y += explLines.length * 5 + 8;

  // Fuentes de valor
  checkOverflow(50);
  if (reading.valueSources.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...IBM_DARK);
    doc.text('Principales fuentes de valor estimado (escenario esperado)', 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Estimado anual', '% del total']],
      body: reading.valueSources.map(src => [src.label, src.valueFormatted, `${src.pct.toFixed(0)}%`]),
      headStyles: { fillColor: IBM_BLUE, textColor: WHITE, fontSize: 8.5 },
      styles: { fontSize: 8.5 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 55, halign: 'right' }, 2: { cellWidth: 25, halign: 'center' } },
    });
    y = lastTableY() + 8;
  }

  // Variables sensibles
  checkOverflow(50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...IBM_DARK);
  doc.text('Variables que más influyen en el resultado', 14, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Variable', 'Valor ingresado / asumido', 'Impacto en el modelo']],
    body: reading.sensitiveVars.map(sv => [sv.label, sv.value, sv.note]),
    headStyles: { fillColor: IBM_DARK, textColor: WHITE, fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 60 }, 2: { cellWidth: 72 } },
  });
  y = lastTableY() + 8;

  // Recomendación
  checkOverflow(40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...IBM_DARK);
  doc.text('Recomendación consultiva', 14, y);
  y += 6;
  doc.setFillColor(240, 246, 255);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 62, 130);
  for (const [i, rec] of reading.recommendations.entries()) {
    checkOverflow(12);
    const recLines = doc.splitTextToSize(`${i + 1}. ${rec}`, 178) as string[];
    const boxH = recLines.length * 5 + 6;
    doc.roundedRect(14, y - 3, 182, boxH, 1, 1, 'F');
    doc.setFontSize(8.5);
    doc.text(recLines, 18, y);
    y += boxH + 2;
  }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('* Lectura generada automáticamente. Revisar con el consultor antes de presentar.', 14, y + 6, { maxWidth: 182 });
  y += 16;

  // ─── PERFIL DEL CLIENTE ───────────────────────────────────────────────────
  checkOverflow(60);
  title('Perfil del cliente', 13);
  hr();
  y += 2;
  kv('Cliente',           model.clientName);
  kv('Industria',         model.industryLabel);
  kv('Moneda',            model.currencyCode);
  kv('Horizonte',         model.horizonLabel);
  kv('Punto de partida',  model.startingPointLabel);
  kv('Driver de evaluación', model.evalDriverLabel);
  kv('Cantidad de apps',  model.appCountLabel);
  kv('Tipo de apps',      model.appTypeLabel);
  kv('Criticidad',        model.criticalityLabel);
  kv('Horario operación', model.operationHoursLabel);
  y += 6;

  // ─── GRÁFICOS 2 y 3: TCO + Ahorros ──────────────────────────────────────
  addPage();
  title('Análisis visual de costos y beneficios', 13);
  hr();
  y += 2;

  y = safeChart(drawTCOChart);
  checkOverflow(85);
  y = safeChart(drawSavingsChart);

  // ─── GRÁFICO 4: Scores visuales ───────────────────────────────────────────
  checkOverflow(70);
  y = safeChart(drawScoreChart);

  // ─── TABLA DETALLADA DE SCORES ────────────────────────────────────────────
  checkOverflow(80);
  title('Scores de contexto y adopción — detalle', 13);
  hr();
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [['Score', 'Valor (0-100)', 'Interpretación']],
    body: model.scores.map(s => [s.label, String(s.valueRounded), s.interpretation]),
    headStyles: { fillColor: IBM_DARK, textColor: WHITE },
    styles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
  });
  y = lastTableY() + 10;

  // ─── RESULTADOS FINANCIEROS ───────────────────────────────────────────────
  checkOverflow(60);
  title('Resultados financieros', 13);
  hr();
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: [
      ['TCO actual anual (estimado)',           model.currentAnnualCostFormatted],
      ['Costo Instana anual total',             model.instanaAnnualCostFormatted],
      ['Horas hombre war room / mes',           formatNumber(results.warRoom.monthlyManHours, 1) + ' h'],
      ['Costo anual war rooms',                 model.warRoomAnnualCostFormatted],
      ['Costo/hora equipo (usado en cálculo)',  model.warRoomHourlyCostFormatted],
    ],
    headStyles: { fillColor: IBM_BLUE, textColor: WHITE },
    styles: { fontSize: 9 },
  });
  y = lastTableY() + 10;


  // ─── ESTIMACION REFERENCIAL DE COSTO INSTANA ─────────────────────────────
  checkOverflow(80);
  title('Estimación referencial de costo Instana', 13);
  hr();
  y += 2;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Estimación referencial. No reemplaza cotización oficial. Alcance: Instana Distributed only; no incluye mainframe, z/OS, MSU, VU, ShopZ ni Workload Pricer.', 14, y, { maxWidth: 182 });
  y += 12;
  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: model.instanaCostRows.map(r => [r.field, r.value]),
    headStyles: { fillColor: IBM_DARK, textColor: WHITE, fontSize: 8.5 },
    styles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 112 } },
  });
  y = lastTableY() + 10;

  // ─── DESGLOSE DE AHORROS — TABLA ─────────────────────────────────────────
  checkOverflow(60);
  title('Desglose de ahorros – Escenario Esperado', 13);
  hr();
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [['Categoría de ahorro', 'Estimado anual']],
    body: [
      ['War rooms',                        sc.expected.warRoomSavingsFormatted],
      ['Administración',                   sc.expected.adminSavingsFormatted],
      ['Infraestructura',                  sc.expected.infraSavingsFormatted],
      ['Racionalización APM actual',       sc.expected.apmRationalizationSavingsFormatted],
      ['Valor cobertura recuperada',       sc.expected.coverageValueFormatted],
      ['Reducción fragmentación',          sc.expected.fragmentationSavingsFormatted],
      ['Gobierno de telemetría',           sc.expected.telemetrySavingsFormatted],
      ['TOTAL BENEFICIO ANUAL ESTIMADO',   sc.expected.totalAnnualBenefitFormatted],
    ],
    headStyles: { fillColor: IBM_TEAL, textColor: WHITE },
    bodyStyles: { fontSize: 9 },
    rowPageBreak: 'avoid',
    didParseCell(data) {
      if (data.row.index === 7) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [208, 226, 255];
      }
    },
  });
  y = lastTableY() + 10;

  // ─── SUPUESTOS DE SIMULACIÓN ──────────────────────────────────────────────
  checkOverflow(80);
  title('Supuestos de simulación', 13);
  hr();
  y += 2;

  if (model.assumptionsCustomized) {
    doc.setFillColor(200, 146, 0);
    doc.roundedRect(14, y - 2, 182, 10, 1, 1, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 22, 22);
    doc.text('⚠  Supuestos personalizados — los valores por defecto fueron modificados.', 18, y + 5);
    y += 16;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(
    'Estos porcentajes son supuestos de simulación. No representan garantías de mejora de IBM o Instana.',
    14, y, { maxWidth: 182 },
  );
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Parámetro', 'Conservador', 'Esperado', 'Optimista']],
    body: model.assumptionRows.map(r => [r.label, r.conservative, r.expected, r.optimistic]),
    headStyles: { fillColor: IBM_DARK, textColor: WHITE, fontSize: 8.5 },
    styles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center' },
      2: { halign: 'center', fillColor: [208, 226, 255] as [number, number, number] },
      3: { halign: 'center' },
    },
  });
  y = lastTableY() + 12;

  // ─── DATOS CLAVE DE ENTRADA ───────────────────────────────────────────────
  checkOverflow(50);
  title('Datos clave de entrada', 13);
  hr();
  y += 2;

  // Mostrar un subconjunto relevante de inputRows (perfil + incidentes + Instana)
  const keyRows = model.inputRows.filter(r =>
    ['Perfil', 'Alcance', 'Incidentes', 'Instana'].includes(r.section)
  );
  autoTable(doc, {
    startY: y,
    head: [['Sección', 'Campo', 'Valor']],
    body: keyRows.map(r => [r.section, r.field, r.value]),
    headStyles: { fillColor: IBM_BLUE, textColor: WHITE, fontSize: 8 },
    styles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 78 },
      2: { cellWidth: 82 },
    },
  });
  y = lastTableY() + 10;

  // ─── INTERPRETACIÓN DEL RESULTADO ─────────────────────────────────────────
  addPage();
  const statusColor = STATUS_COLORS[interpretation.status] ?? GRAY;
  doc.setFillColor(...statusColor);
  doc.roundedRect(14, y - 2, 182, 14, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(`Interpretación del resultado  ·  ${interpretation.badgeLabel}`, 20, y + 7);
  y += 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 22, 22);
  doc.text(interpretation.headline, 14, y, { maxWidth: 182 });
  y += 14;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const contextLines = doc.splitTextToSize(interpretation.context, 182) as string[];
  doc.text(contextLines, 14, y);
  y += contextLines.length * 5 + 8;

  checkOverflow(30);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  const narrativeLines = doc.splitTextToSize(interpretation.narrativeSummary, 182) as string[];
  doc.text(narrativeLines, 14, y);
  y += narrativeLines.length * 5 + 10;

  // Tabla ROI por escenario
  checkOverflow(40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 22, 22);
  doc.text('ROI por escenario', 14, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Escenario', 'ROI', '¿Positivo?']],
    body: [
      ['Conservador', sc.conservative.roiFormatted, sc.conservative.isPositive ? '✓ Sí' : '✗ No'],
      ['Esperado',    sc.expected.roiFormatted,    sc.expected.isPositive    ? '✓ Sí' : '✗ No'],
      ['Optimista',   sc.optimistic.roiFormatted,  sc.optimistic.isPositive  ? '✓ Sí' : '✗ No'],
    ],
    headStyles: { fillColor: IBM_DARK, textColor: WHITE, fontSize: 8.5 },
    styles: { fontSize: 9 },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 2) {
        const isPos = data.cell.text[0]?.startsWith('✓');
        data.cell.styles.textColor = isPos ? IBM_GREEN : IBM_RED;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 40, halign: 'center' } },
  });
  y = lastTableY() + 10;

  if (interpretation.drivers.length > 0) {
    checkOverflow(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 22, 22);
    doc.text('Factores que impactan el resultado', 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Factor', 'Impacto', 'Detalle']],
      body: interpretation.drivers.map(d => [
        d.label,
        d.severity.charAt(0).toUpperCase() + d.severity.slice(1),
        d.description.length > 100 ? d.description.substring(0, 97) + '...' : d.description,
      ]),
      headStyles: { fillColor: IBM_BLUE, textColor: WHITE, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 114 } },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 1) {
          const sev = interpretation.drivers[data.row.index]?.severity;
          if (sev) data.cell.styles.textColor = SEVERITY_COLORS[sev] ?? GRAY;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = lastTableY() + 10;
  }

  if (interpretation.validationSuggestions.length > 0) {
    checkOverflow(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 22, 22);
    doc.text('Datos a validar con el cliente', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    for (const [i, s] of interpretation.validationSuggestions.entries()) {
      checkOverflow(10);
      const lines = doc.splitTextToSize(`${i + 1}. ${s}`, 180) as string[];
      doc.text(lines, 16, y);
      y += lines.length * 5 + 3;
    }
    y += 4;
  }

  if (interpretation.improvementActions.length > 0) {
    checkOverflow(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 22, 22);
    doc.text('Acciones para fortalecer el caso de negocio', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(240, 246, 255);
    for (const [i, a] of interpretation.improvementActions.entries()) {
      checkOverflow(10);
      const lines = doc.splitTextToSize(`${i + 1}. ${a}`, 178) as string[];
      const boxH = lines.length * 5 + 6;
      doc.roundedRect(14, y - 4, 182, boxH, 1, 1, 'F');
      doc.setTextColor(15, 62, 130);
      doc.text(lines, 18, y);
      y += boxH + 2;
    }
    y += 4;
  }

  checkOverflow(14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('* Interpretación generada automáticamente. Revisar con el consultor antes de presentar.', 14, y, { maxWidth: 182 });
  y += 10;

  // ─── RECOMENDACIÓN CONSULTIVA ─────────────────────────────────────────────
  addPage();
  title('Recomendación consultiva', 13);
  hr();
  y += 2;

  const steps = [
    '1. Validar datos de entrada con el cliente (costo APM, frecuencia incidentes, costo hora equipo).',
    '2. Solicitar cotización oficial de Instana para reemplazar los estimados del simulador.',
    '3. Realizar un workshop técnico para evaluar casos de uso específicos.',
    '4. Definir métricas de éxito y KPIs previo a la implementación.',
    '5. Evaluar fase piloto con 2-3 aplicaciones críticas.',
    '6. Revisar el plan de migración y período de coexistencia si aplica.',
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 22, 22);
  for (const step of steps) {
    checkOverflow(8);
    doc.text(step, 14, y, { maxWidth: 182 });
    y += 8;
  }

  y += 6;
  subtitle('Tipos de ROI identificados');
  autoTable(doc, {
    startY: y,
    body: model.activeRoiTypeLabels.map(k => ['✓', k]),
    styles: { fontSize: 9 },
    theme: 'plain',
    columnStyles: { 0: { cellWidth: 8, textColor: IBM_GREEN, fontStyle: 'bold' } },
  });
  y = lastTableY() + 10;

  // ─── NOTAS Y ADVERTENCIAS ─────────────────────────────────────────────────
  checkOverflow(40);
  title('Notas y advertencias', 11);
  hr();

  const notes = [
    '• Esta simulación no incluye precios oficiales de IBM Instana. Los costos deben obtenerse de cotización directa.',
    '• Los porcentajes de mejora (MTTR, MTTD, war rooms) son supuestos del sector, no garantías.',
    '• El costo subutilizado del APM actual se presenta como referencia, no como ahorro directo automático.',
    '• El nivel de confianza depende de la cantidad de datos reales ingresados vs. estimados.',
    '• Los resultados pueden variar significativamente según el contexto del cliente.',
    '• Los gráficos son representaciones vectoriales generadas a partir del ReportModel — sin dependencia de pantalla.',
  ];

  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  for (const note of notes) {
    checkOverflow(8);
    doc.text(note, 14, y, { maxWidth: 182 });
    y += 7;
  }

  // ─── FOOTER en todas las páginas ─────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('Simulador ROI IBM Instana · Herramienta consultiva de preventa · Solo simulación', 14, 292);
    doc.text(`Página ${i} de ${pageCount}`, 185, 292, { align: 'right' });
  }

  // Suprimir advertencia de variable no usada
  void currency;
  void SCENARIO_LABELS;

  const filename = `ROI_Instana_${(state.profile.clientName || 'escenario').replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
