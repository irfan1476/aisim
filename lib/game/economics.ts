import type { FinancialLedger, InitiativeLifecycle } from './businessModel';

/**
 * Pure, replay-safe financial rules. Amounts use the game's active currency
 * unit (for example $M or ₹ Cr); this module intentionally has no knowledge
 * of the currency symbol or UI formatting.
 */
export type FinancialLedgerUpdate = {
  investment?: number;
  runCost?: number;
  crisisCost?: number;
  grossBenefit?: number;
  /** The completed quarter that produced this entry, when known. */
  quarter?: number;
};

export type BenefitRealisationInput = {
  lifecycle: InitiativeLifecycle;
  /** Completed quarters in the current lifecycle phase. Starts at one. */
  quartersInLifecycle?: number;
  /** 0–100 actual adoption of the capability. */
  adoption?: number;
  /** 0–100 readiness after data, operating-model, and control gates. */
  readiness?: number;
  /** A bounded delivery signal. 1 means normal execution. */
  deliveryMultiplier?: number;
};

const round = (value: number) => Number(value.toFixed(4));
const finite = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const nonNegative = (value: unknown) => Math.max(0, finite(value));
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

/** A zero-value ledger suitable for a newly created initiative or campaign. */
export function emptyFinancialLedger(): FinancialLedger {
  return {
    investment: 0,
    runCost: 0,
    crisisCost: 0,
    grossBenefit: 0,
    netBenefit: 0,
    cumulativeInvestment: 0,
    cumulativeNetBenefit: 0,
    realisedROI: 0,
  };
}

/**
 * Realised ROI is deliberately cash-based: cumulative net benefit divided by
 * every cash outflow recorded in the ledger (investment, run cost, and crisis
 * response), expressed as a percentage. A campaign with no spend has no
 * realised return, so it returns zero rather than Infinity.
 */
export function realisedROI(ledger: Pick<FinancialLedger, 'cumulativeInvestment' | 'cumulativeNetBenefit'>): number {
  const invested = nonNegative(ledger.cumulativeInvestment);
  return invested > 0 ? round((finite(ledger.cumulativeNetBenefit) / invested) * 100) : 0;
}

/** Whether cumulative realised benefit has repaid all recorded cash outflows. */
export function hasPaidBack(ledger: Pick<FinancialLedger, 'cumulativeInvestment' | 'cumulativeNetBenefit'>): boolean {
  return nonNegative(ledger.cumulativeInvestment) > 0 && finite(ledger.cumulativeNetBenefit) >= 0;
}

/**
 * Applies one completed-quarter entry without mutating its input. `investment`
 * is new build/scale capital; `runCost` and `crisisCost` are also cash outflows
 * and therefore count toward cumulative investment and payback.
 */
export function updateFinancialLedger(
  previous: FinancialLedger | undefined,
  update: FinancialLedgerUpdate,
): FinancialLedger {
  const prior = previous || emptyFinancialLedger();
  const investment = nonNegative(update.investment);
  const runCost = nonNegative(update.runCost);
  const crisisCost = nonNegative(update.crisisCost);
  const grossBenefit = nonNegative(update.grossBenefit);
  const totalCost = investment + runCost + crisisCost;
  const cumulativeInvestment = round(nonNegative(prior.cumulativeInvestment) + totalCost);
  const netBenefit = round(grossBenefit - totalCost);
  const cumulativeNetBenefit = round(finite(prior.cumulativeNetBenefit) + netBenefit);
  const beforePayback = hasPaidBack(prior);
  const candidate: FinancialLedger = {
    investment,
    runCost,
    crisisCost,
    grossBenefit,
    netBenefit,
    cumulativeInvestment,
    cumulativeNetBenefit,
    paybackQuarter: prior.paybackQuarter,
    realisedROI: 0,
  };
  if (!beforePayback && hasPaidBack(candidate) && Number.isFinite(update.quarter) && Number(update.quarter) > 0) {
    candidate.paybackQuarter = Math.round(Number(update.quarter));
  }
  candidate.realisedROI = realisedROI(candidate);
  return candidate;
}

/**
 * A bounded, transparent S-curve for turning potential benefit into realised
 * benefit. Discovery produces no realised value; pilot proves a small amount;
 * scale ramps quickly; run approaches the full potential. Adoption and
 * readiness are multipliers, so capital alone cannot create value.
 */
export function lifecycleBenefitRealisation(input: BenefitRealisationInput): number {
  const quarter = Math.max(1, Math.floor(finite(input.quartersInLifecycle) || 1));
  const phaseCurve: Record<InitiativeLifecycle, number> = {
    discovery: 0,
    pilot: Math.min(0.3, 0.1 + (quarter - 1) * 0.05),
    scale: Math.min(0.75, 0.35 + (quarter - 1) * 0.1),
    run: Math.min(1, 0.8 + (quarter - 1) * 0.05),
    paused: 0.05,
    retired: 0,
  };
  const adoptionFactor = 0.2 + clamp(finite(input.adoption) / 100) * 0.8;
  const readinessFactor = 0.5 + clamp(finite(input.readiness) / 100) * 0.5;
  const deliveryFactor = clamp(finite(input.deliveryMultiplier) || 1, 0, 1.35);
  return round(clamp(phaseCurve[input.lifecycle] * adoptionFactor * readinessFactor * deliveryFactor));
}

/** Converts potential gross benefit into the realised benefit for this quarter. */
export function realiseBenefit(potentialGrossBenefit: number, input: BenefitRealisationInput): number {
  return round(nonNegative(potentialGrossBenefit) * lifecycleBenefitRealisation(input));
}

