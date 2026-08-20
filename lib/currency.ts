import type { CurrencyMode } from './scenarios/types';

export function formatCurrency(amount: number, currency: CurrencyMode = '$') {
  return `${currency}${Number(amount || 0).toFixed(2)}${currency === '$' ? 'M' : ' Cr'}`;
}

export function formatBudget(amount: number, currency: CurrencyMode = '$') {
  return `${currency}${Number(amount || 0).toFixed(0)}${currency === '$' ? 'M' : ' Cr'}`;
}
