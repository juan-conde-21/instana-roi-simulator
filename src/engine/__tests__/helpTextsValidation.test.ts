import { describe, it, expect } from 'vitest';
import { helpTexts } from '../../content/helpTexts';

// ─── helpTexts — ningún valor debe estar vacío ────────────────────────────────

type LeafRecord = Record<string, string>;

function collectEntries(obj: object, path = ''): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = path ? `${path}.${k}` : k;
    if (typeof v === 'string') {
      out.push({ key: fullKey, value: v });
    } else if (typeof v === 'object' && v !== null) {
      out.push(...collectEntries(v as object, fullKey));
    }
  }
  return out;
}

const allEntries = collectEntries(helpTexts as unknown as object);

describe('helpTexts — all values are non-empty strings', () => {
  it('has at least one entry per section', () => {
    expect(allEntries.length).toBeGreaterThan(40);
  });

  for (const { key, value } of allEntries) {
    it(`helpTexts.${key} is a non-empty string`, () => {
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    });
  }
});

describe('helpTexts — section completeness', () => {
  it('profile section has all expected keys', () => {
    const keys = Object.keys(helpTexts.profile);
    expect(keys).toContain('startingPoint');
    expect(keys).toContain('evalDriver');
    expect(keys).toContain('horizon');
    expect(keys).toContain('currency');
    expect(keys).toContain('industry');
  });

  it('blocks section covers all 8 block types', () => {
    const keys = Object.keys(helpTexts.blocks);
    const expected = ['commercial_apm', 'open_source', 'otel', 'governance', 'fragmentation', 'migration', 'slo_sla', 'security'];
    for (const k of expected) {
      expect(keys).toContain(k);
      expect((helpTexts.blocks as LeafRecord)[k].trim().length).toBeGreaterThan(0);
    }
  });

  it('scores section covers all 10 score keys', () => {
    const keys = Object.keys(helpTexts.scores);
    const expected = [
      'costPressure', 'apmUtilization', 'coverageRestriction', 'operationalDrag',
      'telemetryWaste', 'fragmentation', 'otelReadiness', 'migrationEffort',
      'adoptionReadiness', 'roiConfidence',
    ];
    for (const k of expected) {
      expect(keys).toContain(k);
      expect((helpTexts.scores as LeafRecord)[k].trim().length).toBeGreaterThan(0);
    }
  });

  it('dashboard section has all 8 metric keys', () => {
    const keys = Object.keys(helpTexts.dashboard);
    const expected = ['roi', 'payback', 'tcoActual', 'tcoInstana', 'grossBenefit', 'netBenefit', 'confidence', 'warRoomCost'];
    for (const k of expected) {
      expect(keys).toContain(k);
    }
  });

  it('scenarioEditor section covers all 6 param keys + general/minMax/restoreDefaults', () => {
    const keys = Object.keys(helpTexts.scenarioEditor);
    const expected = [
      'general', 'minMax', 'restoreDefaults',
      'mttrReduction', 'mttdReduction', 'warRoomReduction',
      'adminReduction', 'coverageImprovement', 'fragmentationReduction',
    ];
    for (const k of expected) {
      expect(keys).toContain(k);
      expect((helpTexts.scenarioEditor as LeafRecord)[k].trim().length).toBeGreaterThan(0);
    }
  });
});
