import { SlidersHorizontal, Wallet } from "lucide-react";
import { formatBudget, formatCurrency } from "../lib/currency";
import { calculateActionCapitalPlan, calculateCapitalRunway } from "../lib/game/capital";
import { fundingIntensityFor } from "../lib/game/effectResolver";
import { deploymentCapacity } from "../lib/game/state";
import type { GameViewState } from "./gameViewTypes";
import type { InitiativeActionSet } from "../lib/game/businessModel";
import type { Allocation } from "../lib/game/state";
import type { CapacityIssue } from "../lib/game/capacity";

type Props = {
  state: GameViewState;
  onAllocationChange: (key: string, value: number) => void;
  onDeploymentChange: (amount: number) => void;
  effectiveAllocation?: Allocation;
  capacityIssue?: CapacityIssue;
  onCapacityFix?: () => void;
  compact?: boolean;
};

const labelFor = (key: string) => (key === "mlops" ? "Ops & Maintenance" : key);

/**
 * The operating controls deliberately stay in the decision surface rather
 * than analytics: these inputs are a learner's current move, not a report.
 */
export default function OperatingSystemControls({
  state,
  onAllocationChange,
  onDeploymentChange,
  effectiveAllocation,
  capacityIssue,
  onCapacityFix,
  compact = false,
}: Props) {
  const tailored = state.initiativeAllocationMode === 'custom';
  const displayedAllocation = tailored ? (effectiveAllocation || state.alloc) : state.alloc;
  const total = Number(Object.values(displayedAllocation).reduce((sum, value) => sum + Number(value || 0), 0).toFixed(2));
  const capacity = deploymentCapacity(
    state.campaignBudget,
    state.campaignBudgetRemaining,
    state.quarterlyBudget,
    state.q,
    state.spent,
  );
  const deployment = Math.min(
    Math.max(0, Number(state.deploymentAmount) || 0),
    capacity.maximumDeployment,
  );
  const suggestedDeployment = Math.min(capacity.maximumDeployment, capacity.basePace * 0.6);
  const initiativeActions: InitiativeActionSet = Object.keys(state.initiativeActions || {}).length
    ? state.initiativeActions
    : Object.fromEntries(state.selected.map((id) => [id, "scale" as const]));
  const plan = calculateActionCapitalPlan(state, initiativeActions, deployment);
  const runway = calculateCapitalRunway(state, deployment);
  const deliveryIntensity = fundingIntensityFor(plan.deliveryCapital, plan.initiativeMinimum);
  const additionalMaturityCredit = plan.initiativeMinimum > 0
    ? Math.min(1, Math.max(0, plan.deliveryCapital / plan.initiativeMinimum - 1))
    : 0;
  const releasePlan = (amount: number) =>
    onDeploymentChange(Number(Math.min(capacity.maximumDeployment, Math.max(0, amount)).toFixed(1)));

  return (
    <section className={`rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] ${compact ? "p-3" : "p-4"}`} aria-label="Balance the operating system">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#dafbe1] text-[#1a7f37]"><SlidersHorizontal size={15} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1a7f37]">{tailored ? 'Capacity mix · derived' : 'Operating system · shared mix'}</p>
            <p className="mt-1 text-xs leading-5 text-[#57606a]">{tailored ? 'This weighted portfolio mix comes from the tailored initiative plans below. Switch to shared mix to change every initiative at once.' : 'Shift the capability mix, then set the capital you want to release this quarter.'}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${total === 100 ? "bg-[#e8f4eb] text-[#176b36]" : "bg-[#edf0ee] text-[#303832]"}`}>{total}% allocated</span>
      </div>

      <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {Object.entries(displayedAllocation).map(([key, value]) => (
          <label key={key} className="group block rounded-xl bg-white px-3 py-2.5 ring-1 ring-inset ring-[#d8dee4] transition hover:ring-[#1a7f37]/45 focus-within:ring-2 focus-within:ring-[#1a7f37]">
            <span className="flex justify-between gap-2 text-[11px] font-bold text-[#24292f]">
              <span className="capitalize">{labelFor(key)}</span>
              <span className="shrink-0 text-[#57606a]">{value}% · {formatCurrency((Number(value) / 100) * deployment, state.currencyMode)}</span>
            </span>
            <input
              data-testid={`allocation-${key}`}
              aria-label={`${labelFor(key)} allocation`}
              type="range"
              min="5"
              max="50"
              value={value}
              disabled={tailored}
              onChange={(event) => onAllocationChange(key, Number(event.target.value))}
              className="mt-2 w-full cursor-ew-resize accent-[#1a7f37] disabled:cursor-not-allowed disabled:opacity-55"
            />
          </label>
        ))}
      </div>

      {capacityIssue && onCapacityFix && <div className="mt-3 rounded-xl border border-[#bf8700]/35 bg-[#fff8c5] p-3"><p className="text-[11px] font-bold text-[#6b4f00]">This plan is over {capacityIssue.code === 'HUMAN_OVERSIGHT_CAPACITY' ? 'human oversight' : 'operating'} capacity.</p><p className="mt-1 text-[10px] leading-4 text-[#6b4f00]">Use the quick fix to adjust the mix to the minimum capacity needed. You can edit the resulting allocation afterward.</p><button type="button" onClick={onCapacityFix} className="mt-2 rounded-lg bg-[#24292f] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#0969da]">Make plan executable</button></div>}

      <div className="mt-4 rounded-xl border border-[#b8d8c0] bg-[#f2f8f3] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2">
            <Wallet size={15} className="mt-0.5 shrink-0 text-[#1a7f37]" />
            <div>
              <p className="text-xs font-bold text-[#24292f]">Deploy this quarter</p>
              <p className="mt-1 text-[11px] leading-4 text-[#57606a]">The quarterly pace is a guide, not a gate. Release any amount of the remaining campaign reserve; unused capital carries forward.</p>
            </div>
          </div>
          <b className="shrink-0 text-sm text-[#24292f]">{formatBudget(deployment, state.currencyMode)}</b>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#57606a]">Capital to release</span>
            <div className="mt-1 flex items-center overflow-hidden rounded-lg border border-[#9bc9a7] bg-white focus-within:ring-2 focus-within:ring-[#1a7f37]">
              <span className="border-r border-[#d0d7de] px-2 py-2 text-xs font-bold text-[#57606a]">{state.currencyMode === "₹" ? "₹ Cr" : "$M"}</span>
              <input
                data-testid="deployment-amount"
                aria-label="Capital to release this quarter"
                type="number"
                inputMode="decimal"
                min="0"
                max={Math.max(0, capacity.maximumDeployment)}
                step="0.1"
                value={Number(deployment.toFixed(2))}
                onChange={(event) => releasePlan(Number(event.target.value))}
                className="w-24 bg-transparent px-2 py-2 text-sm font-bold text-[#24292f] outline-none"
              />
            </div>
          </label>
          <p className="max-w-[18rem] text-right text-[10px] leading-4 text-[#57606a]">
            Available now: <b className="text-[#24292f]">{formatBudget(capacity.maximumDeployment, state.currencyMode)}</b>. This is a release decision, not a quarterly cap.
          </p>
        </div>
        <input
          aria-label="Capital release slider"
          type="range"
          min="0"
          max={Math.max(0, capacity.maximumDeployment)}
          step="0.1"
          value={deployment}
          onChange={(event) => releasePlan(Number(event.target.value))}
          className="mt-3 w-full cursor-ew-resize accent-[#1a7f37]"
        />
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[#57606a]">
          <span>Initiative floor: {formatCurrency(plan.initiativeMinimum, state.currencyMode)}</span>
          <span>Continuity: {formatCurrency(plan.maintenanceSpend, state.currencyMode)}</span>
          <span>Scale-up: {formatCurrency(plan.accelerationSpend, state.currencyMode)}</span>
          <span>Crisis response: {formatCurrency(plan.crisisResponseSpend, state.currencyMode)}</span>
          <span>Recommended pace: {formatBudget(capacity.recommendedAuthority, state.currencyMode)}</span>
          <span className="font-bold text-[#24292f]">Available reserve: {formatBudget(capacity.maximumDeployment, state.currencyMode)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => releasePlan(plan.requiredCapital)} className="rounded-lg border border-[#1a7f37] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#17351f] transition hover:bg-[#e8f4eb]">Fund selected plan · {formatBudget(plan.requiredCapital, state.currencyMode)}</button>
          <button type="button" onClick={() => releasePlan(suggestedDeployment)} className="rounded-lg border border-[#9bc9a7] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#17351f] transition hover:bg-[#e8f4eb]">Use suggested pace · {formatBudget(suggestedDeployment, state.currencyMode)}</button>
          <button type="button" onClick={() => releasePlan(capacity.maximumDeployment)} className="rounded-lg border border-[#d0d7de] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#57606a] transition hover:bg-[#f6f8fa]">Release full reserve</button>
        </div>
        {plan.accelerationSpend > 0 && plan.initiativeMinimum > 0 && state.selected.length > 0 && (
          <div className="mt-3 rounded-lg border border-[#9bc9a7] bg-white px-3 py-2 text-[10px] leading-4 text-[#57606a]">
            <b className="text-[#176b36]">Scale-up is active.</b> {formatBudget(plan.accelerationSpend, state.currencyMode)} above the floor is distributed across the selected work. It raises this quarter&apos;s delivery intensity to <b className="text-[#24292f]">{deliveryIntensity.toFixed(2)}×</b> and earns up to <b className="text-[#24292f]">{additionalMaturityCredit.toFixed(1)} extra maturity credit</b> per selected initiative; later-quarter capability and risk effects compound from that faster maturity.
          </div>
        )}
        <p className={`mt-2 text-[10px] leading-4 ${runway.depletionQuarter ? "text-[#9a6700]" : "text-[#1a7f37]"}`}>{runway.message}</p>
      </div>
      {total !== 100 && <p className="mt-3 rounded-lg bg-[#fff8c5] px-3 py-2 text-[11px] font-bold text-[#6b4f00]">This mix is {total}%. Adjust the controls to exactly 100% before confirming this quarter.</p>}
    </section>
  );
}
