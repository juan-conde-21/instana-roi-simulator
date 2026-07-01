/**
 * Gráficos vectoriales para el PDF del Simulador ROI IBM Instana.
 *
 * Estrategia: dibujo programático con primitivas jsPDF en lugar de html2canvas.
 * Ventajas: sin dependencia DOM, sin problemas de renderizado SVG, output crisp,
 * PDF más pequeño, robusto ante datos vacíos o parciales.
 *
 * Cada función recibe (doc, y, model) y devuelve el nuevo y tras dibujar.
 * Si los datos son insuficientes, dibuja un placeholder y sigue.
 */

import jsPDF from 'jspdf';
import type { ReportModel } from '../engine/reportModel';

// ─── Paleta IBM/Instana ───────────────────────────────────────────────────────

type RGB = [number, number, number];

const C: Record<string, RGB> = {
  blue:      [15, 98, 254],
  dark:      [0, 29, 108],
  teal:      [8, 189, 186],
  red:       [218, 30, 40],
  green:     [36, 161, 72],
  yellow:    [200, 146, 0],
  orange:    [212, 90, 0],
  gray:      [82, 82, 82],
  lightGray: [244, 244, 244],
  midGray:   [198, 198, 198],
  white:     [255, 255, 255],
  text:      [22, 22, 22],
};

// Colores fijos para scores
const SCORE_COLORS: Record<string, RGB> = {
  costPressure:        C.red,
  apmUtilization:      C.blue,
  coverageRestriction: C.orange,
  operationalDrag:     [159, 24, 83],
  telemetryWaste:      C.yellow,
  fragmentation:       C.red,
  otelReadiness:       C.teal,
  migrationEffort:     C.orange,
  adoptionReadiness:   C.green,
  roiConfidence:       C.blue,
};

// ─── Layout ───────────────────────────────────────────────────────────────────

const CX = 14;          // margen izquierdo
const CW = 182;         // ancho total del área de gráfico
const LW = 54;          // columna de etiqueta
const VW = 26;          // columna de valor (derecha)
const BX = CX + LW;    // inicio de barras
const BW = CW - LW - VW; // ancho disponible para barras (~102mm)
const BAR_H = 6;        // altura de cada barra
const ROW_H = 10;       // altura de fila (barra + espacio)

// ─── Utilidades internas ──────────────────────────────────────────────────────

function fill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function draw(doc: jsPDF, c: RGB, w = 0.3) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(w); }
function tcolor(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

function chartTitle(doc: jsPDF, label: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  tcolor(doc, C.dark);
  doc.text(label, CX, y);
  y += 4;
  draw(doc, C.blue, 0.4);
  doc.line(CX, y, CX + CW, y);
  return y + 3;
}

function noData(doc: jsPDF, y: number, reason = 'Sin datos para mostrar este gráfico.'): number {
  fill(doc, C.lightGray);
  doc.roundedRect(CX, y, CW, 10, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  tcolor(doc, C.gray);
  doc.text(reason, CX + 4, y + 6.5);
  return y + 14;
}

function chartBg(doc: jsPDF, y: number, totalH: number) {
  fill(doc, C.lightGray);
  doc.roundedRect(CX, y - 2, CW, totalH + 4, 1, 1, 'F');
}

/** Formatea número con sufijo K/M + código de moneda. */
export function formatK(v: number, currency: string): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ${currency}`;
  if (abs >= 1_000)     return `${sign}${Math.round(abs / 1_000)}K ${currency}`;
  return `${sign}${Math.round(abs)} ${currency}`;
}

/** Recorta texto a un ancho máximo de caracteres. */
function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ─── Gráfico 1: ROI por escenario ────────────────────────────────────────────
// Barras horizontales bi-direccionales: positivo→derecha, negativo→izquierda.

export function drawROIChart(doc: jsPDF, y: number, model: ReportModel): number {
  y = chartTitle(doc, 'ROI por escenario', y);

  const items = [
    { label: 'Conservador', roi: model.scenarios.conservative.roi, payback: model.scenarios.conservative.paybackMonths, color: C.yellow },
    { label: 'Esperado',    roi: model.scenarios.expected.roi,     payback: model.scenarios.expected.paybackMonths,     color: C.blue },
    { label: 'Optimista',   roi: model.scenarios.optimistic.roi,   payback: model.scenarios.optimistic.paybackMonths,   color: C.green },
  ];

  chartBg(doc, y, items.length * ROW_H);

  // Escala: al menos ±100% como referencia
  const maxAbs = Math.max(...items.map(i => Math.abs(i.roi)), 100);
  const halfBW = BW / 2;
  const zeroX = BX + halfBW;

  // Línea de cero
  draw(doc, C.midGray, 0.4);
  doc.line(zeroX, y - 1, zeroX, y + items.length * ROW_H + 1);
  doc.setFontSize(6.5);
  tcolor(doc, C.gray);
  doc.text('0%', zeroX - 3.5, y - 2.5);

  for (const [i, item] of items.entries()) {
    const ry = y + i * ROW_H;

    // Etiqueta
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    tcolor(doc, C.gray);
    doc.text(item.label, CX + 1, ry + BAR_H * 0.72);

    // Barra
    const scale = Math.min(Math.abs(item.roi) / maxAbs, 1);
    const barLen = halfBW * scale;
    fill(doc, item.color as RGB);
    if (item.roi < 0) {
      doc.rect(zeroX - barLen, ry, barLen, BAR_H, 'F');
    } else {
      doc.rect(zeroX, ry, barLen, BAR_H, 'F');
    }

    // Valor ROI
    const sign = item.roi >= 0 ? '+' : '';
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    tcolor(doc, item.roi < 0 ? C.red : C.dark);
    doc.text(`${sign}${Math.round(item.roi)}%`, CX + CW - VW + 1, ry + BAR_H * 0.72);

    // Payback secundario
    const pbStr = item.payback < 998 ? `${Math.round(item.payback)}m payback` : 'sin payback';
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    tcolor(doc, C.gray);
    doc.text(pbStr, CX + CW - VW + 1, ry + BAR_H * 0.72 + 3.5);
  }

  return y + items.length * ROW_H + 8;
}

// ─── Gráfico 2: TCO comparativo ──────────────────────────────────────────────
// Dos sub-barras por período (Actual = rojo, Instana = azul), con badge de ahorro.

export function drawTCOChart(doc: jsPDF, y: number, model: ReportModel): number {
  y = chartTitle(doc, 'TCO comparativo — Escenario Esperado (acumulado)', y);

  const sr = model.results.scenarios.expected;
  const currency = model.currencyCode;

  const groups = [
    { label: '12 meses', actual: sr.tcoCurrentYear1, instana: sr.tco12 },
    { label: '24 meses', actual: sr.tcoCurrentYear1 + sr.tcoCurrentYear2, instana: sr.tco24 },
    { label: '36 meses', actual: sr.tcoCurrentYear1 + sr.tcoCurrentYear2 + sr.tcoCurrentYear3, instana: sr.tco36 },
  ];

  // Si todo es cero, mostrar placeholder
  if (groups.every(g => g.actual === 0 && g.instana === 0)) {
    return noData(doc, y, 'Ingresar costos de Instana para calcular el TCO.');
  }

  // Leyenda
  fill(doc, C.red);
  doc.rect(CX, y, 5, 3.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  tcolor(doc, C.gray);
  doc.text('Situación actual', CX + 7, y + 3);

  fill(doc, C.blue);
  doc.rect(CX + 48, y, 5, 3.5, 'F');
  doc.text('Con Instana', CX + 56, y + 3);
  y += 8;

  const SUB_H = BAR_H;
  const SUB_GAP = 2;
  const GROUP_GAP = 5;
  const GROUP_H = SUB_H + SUB_GAP + SUB_H + GROUP_GAP;

  const maxVal = Math.max(...groups.flatMap(g => [g.actual, g.instana]), 1);

  chartBg(doc, y, groups.length * GROUP_H - GROUP_GAP + 2);

  for (const [gi, group] of groups.entries()) {
    const gy = y + gi * GROUP_H;

    // Etiqueta del grupo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    tcolor(doc, C.dark);
    doc.text(group.label, CX + 1, gy + SUB_H * 0.72);

    // Barra Actual
    const actualLen = BW * Math.min(group.actual / maxVal, 1);
    fill(doc, C.red);
    doc.rect(BX, gy, actualLen, SUB_H, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    tcolor(doc, C.text);
    doc.text(formatK(group.actual, currency), CX + CW - VW + 1, gy + SUB_H * 0.72);

    // Barra Instana
    const iy = gy + SUB_H + SUB_GAP;
    const instanaLen = BW * Math.min(group.instana / maxVal, 1);
    fill(doc, C.blue);
    doc.rect(BX, iy, instanaLen, SUB_H, 'F');
    doc.setFont('helvetica', 'bold');
    tcolor(doc, C.blue);
    doc.text(formatK(group.instana, currency), CX + CW - VW + 1, iy + SUB_H * 0.72);

    // Badge de ahorro porcentual
    const saving = group.actual - group.instana;
    if (saving > 0 && group.actual > 0) {
      const pct = Math.round((saving / group.actual) * 100);
      const badge = `-${pct}%`;
      const bw = doc.getTextWidth(badge) + 3;
      const bx = BX + instanaLen + 2;
      fill(doc, C.teal);
      doc.roundedRect(bx, iy, bw, 5, 0.5, 0.5, 'F');
      doc.setFontSize(6.5);
      tcolor(doc, C.white);
      doc.text(badge, bx + 1.5, iy + 3.5);
    }
  }

  return y + groups.length * GROUP_H + 6;
}

// ─── Gráfico 3: Desglose de ahorros ──────────────────────────────────────────
// Barras horizontales proporcionales, ordenadas de mayor a menor.

export function drawSavingsChart(doc: jsPDF, y: number, model: ReportModel): number {
  y = chartTitle(doc, 'Ahorros estimados por categoría — Escenario Esperado', y);

  const sr = model.results.scenarios.expected;
  const currency = model.currencyCode;

  const categories = [
    { label: 'War rooms',          value: sr.warRoomSavings,              color: C.blue },
    { label: 'Administración',     value: sr.adminSavings,                color: C.teal },
    { label: 'Infraestructura',    value: sr.infraSavings,                color: C.green },
    { label: 'Racionalización APM',value: sr.apmRationalizationSavings,   color: C.orange },
    { label: 'Cobertura',          value: sr.coverageValue,               color: [15, 98, 200] as RGB },
    { label: 'Fragmentación',      value: sr.fragmentationSavings,        color: C.yellow },
    { label: 'Telemetría',         value: sr.telemetrySavings,            color: C.teal },
  ]
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  if (categories.length === 0) {
    return noData(doc, y, 'Sin ahorros calculados. Completar los bloques opcionales y costos de Instana.');
  }

  const maxVal = Math.max(...categories.map(c => c.value));
  const total  = categories.reduce((s, c) => s + c.value, 0);

  chartBg(doc, y, categories.length * ROW_H);

  for (const [i, cat] of categories.entries()) {
    const ry = y + i * ROW_H;

    // Etiqueta
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    tcolor(doc, C.gray);
    doc.text(trunc(cat.label, 16), CX + 1, ry + BAR_H * 0.72);

    // Barra
    const barLen = BW * (cat.value / maxVal);
    fill(doc, cat.color as RGB);
    doc.rect(BX, ry, barLen, BAR_H, 'F');

    // % dentro de la barra (si hay espacio)
    const pct = Math.round((cat.value / total) * 100);
    if (barLen > 14) {
      doc.setFontSize(6);
      tcolor(doc, C.white);
      doc.text(`${pct}%`, BX + barLen - 11, ry + BAR_H * 0.72);
    }

    // Valor
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    tcolor(doc, C.dark);
    doc.text(formatK(cat.value, currency), CX + CW - VW + 1, ry + BAR_H * 0.72);
  }

  // Total
  const totalY = y + categories.length * ROW_H + 2;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  tcolor(doc, C.dark);
  doc.text('TOTAL', CX + 1, totalY + 4);
  tcolor(doc, C.blue);
  doc.text(formatK(total, currency), CX + CW - VW + 1, totalY + 4);

  return totalY + 10;
}

// ─── Gráfico 4: Scores visuales ──────────────────────────────────────────────
// Dos columnas de barras de progreso (0-100), con color por categoría.

export function drawScoreChart(doc: jsPDF, y: number, model: ReportModel): number {
  y = chartTitle(doc, 'Scores de contexto y adopción (0 – 100)', y);

  const scores = model.scores;
  if (!scores.length) {
    return noData(doc, y, 'Sin scores calculados.');
  }

  // Dos columnas
  const half   = Math.ceil(scores.length / 2);
  const leftCol  = scores.slice(0, half);
  const rightCol = scores.slice(half);
  const rowCount = half;

  const COL_W  = Math.floor(CW / 2) - 3;
  const COL_LW = 35;  // etiqueta
  const COL_BW = COL_W - COL_LW - 12; // barra
  // Col izq: empieza en CX; col der: empieza en CX + COL_W + 6
  const colXL = CX;
  const colXR = CX + COL_W + 6;

  chartBg(doc, y, rowCount * ROW_H);

  const drawRow = (s: { key: string; label: string; value: number }, ry: number, colX: number) => {
    const color = SCORE_COLORS[s.key] ?? C.blue;
    const barX = colX + COL_LW;

    // Etiqueta
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    tcolor(doc, C.gray);
    doc.text(trunc(s.label, 18), colX + 1, ry + BAR_H * 0.72);

    // Track (fondo gris)
    fill(doc, C.midGray);
    doc.rect(barX, ry + 1, COL_BW, BAR_H - 2, 'F');

    // Fill proporcional
    fill(doc, color as RGB);
    const fillLen = COL_BW * (Math.min(s.value, 100) / 100);
    if (fillLen > 0) doc.rect(barX, ry + 1, fillLen, BAR_H - 2, 'F');

    // Valor numérico
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    tcolor(doc, C.dark);
    doc.text(String(Math.round(s.value)), barX + COL_BW + 2, ry + BAR_H * 0.72);
  };

  for (const [i, s] of leftCol.entries())  drawRow(s, y + i * ROW_H, colXL);
  for (const [i, s] of rightCol.entries()) drawRow(s, y + i * ROW_H, colXR);

  return y + rowCount * ROW_H + 8;
}
