import type { SimulationState } from '../types';
import { DEFAULT_STATE } from '../data/defaults';

const STORAGE_KEY = 'instana_roi_simulator_v1';

export function saveState(state: SimulationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable
  }
}

export function loadState(): SimulationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SimulationState>;
    // Deep merge with defaults to handle new fields added after save
    return deepMerge(DEFAULT_STATE, parsed) as SimulationState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function deepMerge(defaults: unknown, overrides: unknown): unknown {
  if (typeof defaults !== 'object' || defaults === null) return overrides ?? defaults;
  if (typeof overrides !== 'object' || overrides === null) return defaults;
  // Arrays (e.g. [min, max] tuples in ScenarioAssumptions) must not be spread into plain objects.
  // Use the stored value directly; do not attempt element-level merging.
  if (Array.isArray(overrides)) return overrides;
  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const key of Object.keys(overrides as Record<string, unknown>)) {
    const defVal = (defaults as Record<string, unknown>)[key];
    const ovVal = (overrides as Record<string, unknown>)[key];
    result[key] = deepMerge(defVal, ovVal);
  }
  return result;
}
