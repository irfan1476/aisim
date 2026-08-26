/**
 * Shared contracts for the versioned business-model redesign.  These types
 * deliberately contain no rules so independent model lanes can build against
 * one stable vocabulary before the turn resolver is rewired.
 */

export type InitiativeLifecycle = 'discovery' | 'pilot' | 'scale' | 'run' | 'paused' | 'retired';

export type InitiativeAction = 'discover' | 'pilot' | 'scale' | 'maintain' | 'pause' | 'retire';

export type InitiativeFunding = {
  discovery: number;
  delivery: number;
  scaleUp: number;
  run: number;
  continuity: number;
  retirement: number;
  total: number;
};

export type FinancialLedger = {
  investment: number;
  runCost: number;
  crisisCost: number;
  grossBenefit: number;
  netBenefit: number;
  cumulativeInvestment: number;
  cumulativeNetBenefit: number;
  paybackQuarter?: number;
  realisedROI?: number;
};

export type CapacityState = {
  deliveryTeams: number;
  changeCapacity: number;
  dataEngineeringCapacity: number;
  governanceReviewCapacity: number;
};

export type InitiativeRequirements = {
  deliveryLoad: number;
  changeLoad: number;
  dataLoad: number;
  governanceLoad: number;
  minimumDataReadiness: number;
  minimumControlMaturity: number;
};

export type GateStatus = 'blocked' | 'conditional' | 'ready';

export type GateResult = {
  status: GateStatus;
  reasons: string[];
  deliveryMultiplier: number;
  riskAdjustment: number;
};

export type InitiativeActionSet = Record<string, InitiativeAction>;
