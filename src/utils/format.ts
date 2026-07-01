import { CURRENCY_SYMBOLS } from '../data/defaults';
import type { Currency } from '../types';

export function formatCurrency(value: number, currency: Currency, customSymbol = ''): string {
  const symbol = currency === 'OTHER' ? customSymbol : (CURRENCY_SYMBOLS[currency] ?? '$');
  if (Math.abs(value) >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(0)}K`;
  }
  return `${symbol}${value.toFixed(0)}`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMonths(months: number): string {
  if (months >= 999) return 'N/A';
  if (months <= 0) return '< 1 mes';
  if (months === 1) return '1 mes';
  return `${months} meses`;
}
