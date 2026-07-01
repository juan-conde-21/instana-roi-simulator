import { describe, expect, it, vi } from 'vitest';
import { calculate } from '../calculator';
import { buildReportModel } from '../reportModel';
import { DEFAULT_STATE } from '../../data/defaults';

const xlsxMock = vi.hoisted(() => ({
  appended: [] as Array<{ name: string; data: unknown[][] }>,
  writeFile: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn((data: unknown[][]) => ({ __data: data })),
    book_append_sheet: vi.fn((_wb: unknown, ws: { __data: unknown[][] }, name: string) => {
      xlsxMock.appended.push({ name, data: ws.__data });
    }),
  },
  writeFile: xlsxMock.writeFile,
}));

describe('export pricing model', () => {
  it('Excel agrega hoja Costo Instana desde ReportModel', async () => {
    xlsxMock.appended.length = 0;
    const state = {
      ...DEFAULT_STATE,
      instanaCosts: {
        ...DEFAULT_STATE.instanaCosts,
        costMode: 'detailed' as const,
        deploymentModel: 'saas' as const,
        standardMvsQty: 50,
        standardMonthlyUnitPrice: 100,
        standardMonths: 12,
        discountPercent: 20,
      },
    };
    const model = buildReportModel(state, calculate(state));
    const { exportToExcel } = await import('../../export/excel');

    exportToExcel(model);

    const sheet = xlsxMock.appended.find(s => s.name === 'Costo Instana');
    expect(sheet).toBeDefined();
    const text = sheet?.data.flat().join(' ') ?? '';
    expect(text).toContain('ESTIMACION REFERENCIAL DE COSTO INSTANA');
    expect(text).toContain('Calculado referencial');
    expect(text).toContain('Standard / APM MVS');
    expect(text).toContain('Descuento aplicado');
    expect(text).toContain('No reemplaza cotizacion oficial');
    expect(text).not.toContain('PS');
    expect(xlsxMock.writeFile).toHaveBeenCalledOnce();
  });
});
