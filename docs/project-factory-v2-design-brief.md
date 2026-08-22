# Project Factory 2030 v2: Reference-Pack Design Brief

Status: agreed product choices; proposed architecture and content detail — planning only
Date: 2026-08-21
Reference decision: Project Factory is the first v2 conversion; BharatMart is the first net-new domain after the four existing packs are deepened.

Related records:

- [Current Scenarios: Depth-Layer Architecture and Change Approach](./current-scenarios-v2-approach.md)
- [Scenario Learning Research and Architecture](./scenario-learning-research-and-architecture.md)
- [Project Decision Log](./decision-log.md)

## Purpose

Project Factory v2 must demonstrate that a learner can make a justified, sequenced AI transformation decision under operational uncertainty—not merely select three attractive use cases.

The pack is a **reference implementation**, not the largest possible simulation. Its purpose is to prove reusable primitives that BankNext, Care360, FutureReady, and later BharatMart can use without engine branches by scenario name.

## Agreed product and learning decisions

| Topic | Agreed direction | Design consequence |
|---|---|---|
| Primary learner | Functional managers and MBA/management learners | Use executive language but explain domain evidence; assess judgement, not specialist engineering expertise. |
| Delivery format | 90-minute facilitated team exercise, with self-paced fallback | The core experience must support discussion and debrief without making a solo learner dependent on a facilitator. |
| Assessment | Formative, transparent scorecard in the first pilot; no high-stakes grading | Score components support reflection and calibration, not a definitive learner grade. |
| Context | India-first operations with globally portable concepts | Retain ₹/Cr, OEM and local-supply-chain context; explain specific local/legal references in content rather than embedding them in engine rules. |
| Evidence | Clearly labelled expert-calibrated synthetic evidence until anonymised data is available | Every evidence artefact needs provenance, confidence, and review metadata. |
| Portfolio policy | Fewer than three initiatives are allowed; no more than two initiatives may be in pilot or scale at once | Focus and sequencing are assessed; the experience must distinguish lightweight research from capacity-consuming delivery work. |
| Learner role | One transformation lead, playable solo or by a team making one shared decision | Stakeholders are authored perspectives and rule inputs; formal multi-role team mode is deferred. |

## Baseline assessment: agreed v3 contract

The existing five prompts are useful because they make an opening decision posture visible before the learner sees results. They should remain a short, non-graded baseline and be used in the hypothesis screen, advisor coaching, and final debrief.

However, V3 should distinguish **reflection** from **scenario calibration**:

- The baseline should not alter the factory’s facts, initiative effectiveness, event probability, scorecard, or difficulty.
- The same Project Factory pack, seed, and decisions should resolve identically regardless of baseline answers.
- The baseline may personalise reflective prompts: what the learner expected, what they chose, what happened, and what they would carry into future decisions.
- Existing v1/v2 behaviour remains unchanged until integration; this rule applies only to the opted-in Project Factory v3 pack.

This is necessary because the current implementation passes the responses into `createInferredGeneration`. That generated context feeds initiative conditions and scenario effects, so the current “there are no wrong answers” language describes learner intent but not actual system behaviour. V3 should align the implementation with the learning promise.

### Agreed question design

The five underlying dimensions and revised wording below are agreed for the pilot. They are reflective, decision-relevant, and non-leading.

| Dimension | Current wording | Proposed v3 wording | Rationale |
|---|---|---|---|
| People and adoption | People enablement is as important as model quality. | **When deciding whether to scale AI, I give people enablement and workflow change as much attention as technical model quality.** | Connects to an observable scaling decision without suggesting a universal answer. |
| Speed and risk posture | I would accept higher risk for faster AI value. | **When an AI opportunity looks valuable, I tend to favour moving quickly rather than seeking additional assurance first.** | Avoids ambiguous “higher risk”; makes the trade-off a preference, not a claim about acceptable harm. |
| Governance posture | Governance should be funded before scaling AI. | **I see governance evidence and accountable ownership as prerequisites for scaling AI.** | Matches V3 governance gates and moves beyond a generic funding statement. |
| Portfolio posture | A balanced portfolio beats a single high-ROI bet. | **I prefer a balanced portfolio even when one AI initiative appears to have the strongest early ROI.** | Preserves the tension while acknowledging early ROI is not the sole decision criterion. |
| Board communication confidence | I am confident explaining AI payback to a CFO. | **I am confident explaining an AI investment case to a CFO, including assumptions, costs, risks, and expected operating value.** | Turns a broad confidence statement into a board-quality communication capability. |

Use the same 1–5 agreement scale and “there are no wrong answers” framing. The questions should be introduced as a **decision posture baseline**, not a personality type or competence test.

### Baseline-to-debrief loop

At debrief, show a concise comparison rather than an alignment score:

| Baseline posture | Decisions and evidence | Reflection prompt |
|---|---|---|
| People and workflow change | change/training capacity, technician response, adoption outcome | What evidence strengthened or changed your view of people enablement? |
| Speed and assurance | lifecycle pacing, gates met/repaired, event response | When did speed help, and when did assurance protect value? |
| Governance before scale | ownership, validation/controls, gate history | Which governance action made a business decision possible or safer? |
| Portfolio balance | active initiatives, capacity choices, deferred work | Did focus or breadth create more value in this context? |
| CFO communication confidence | value hypothesis, assumptions, predicted/actual result | What would you now say differently in a CFO conversation? |

The formative scorecard evaluates observable decision evidence. It must not reward the learner for endorsing a particular baseline answer.

## Reflection architecture — agreed first-pilot design

The baseline comparison is necessary but not sufficient. Reflection occurs at decision points, when a learner can still revise a hypothesis, rather than only as a retrospective final-screen activity. The first pilot uses a **structured, evidence-led debrief**, with a human facilitator remaining the primary discussion lead in team mode.

The business adaptation of a simulation debrief is:

1. **Reconstruct:** What did we decide, predict, and observe?
2. **Interpret:** Which evidence, assumption, trade-off, or stakeholder perspective explains the result?
3. **Reframe:** What would we keep, revise, pause, or test next?
4. **Transfer:** What principle or action would we apply in a real transformation decision?

This is an adaptation for executive learning, not a claim that a healthcare debriefing framework transfers unchanged. It should be tested for clarity, psychological safety, and cognitive load with the target learners.

| Moment | Structured learner activity | Evidence available | Output and boundary |
|---|---|---|---|
| Pre-brief | Record decision posture and a value hypothesis. | Initial evidence pack, known unknowns, baseline assessment. | Hypothesis and unresolved assumption; neither changes simulation mechanics. |
| Before each board window | State the most consequential trade-off and a prediction. | Visible evidence, initiative plan, gates, capacity, stakeholder state. | Decision-ledger fields; one concise prompt, with an optional private note. |
| After a material result, event, or gate | Identify what was observed, what assumption was supported or challenged, and the next experiment or adjustment. | Actual metric movement, event/gate explanation, ledger history. | One short guided reflection; it never creates an outcome or score adjustment. |
| Final debrief | Compare initial posture, decisions, predictions, outcomes, and a workplace transfer commitment. | Full visible ledger, scorecard evidence, baseline comparison. | A learner-owned action, trigger, and metric to take forward; no personality judgement or composite reflection score. |

### Design safeguards

- Keep the required reflection load small: at most one concise checkpoint per board window, with free text optional. A 90-minute team session needs time for discussion and decisions, not a long journal.
- Separate the **formative scorecard** (observable decision evidence) from the **reflection record** (learner interpretation and intent). Do not convert belief/action alignment into a grade or a `self-awareness` number.
- Ground prompts in learner-visible facts and distinguish a fact, an inference, and an unresolved assumption. Do not retrospectively assert an invented cause for a result.
- Permit a learner or team to disagree with the suggested reflection prompt and record an alternative interpretation. This supports psychological safety and avoids a false single-answer narrative.
- In team mode, let the team record one shared answer and optionally retain private notes; the facilitator guide should use prompts, pauses, and peer challenge rather than treating the software as the evaluator.

### AI reflection coach — deliberately deferred

An AI conversational coach is a promising enhancement for self-paced debriefing and pre-facilitation scaffolding, but it should **not** be part of the initial Project Factory V3 vertical slice. The technical chat endpoint is relatively small compared with the engine work; the meaningful complexity is pedagogical and operational: grounding, tone, transcript/privacy handling, disclosure, cost and failure behaviour, evaluation, and preventing plausible but false explanations.

The first pilot should prove the structured reflection flow above. After that, a coach can be evaluated in three bounded uses:

1. a pre-debrief scaffold that helps a learner organise observations before a human-led discussion;
2. a self-paced guide that asks one Socratic question at each reflection stage; and
3. a cross-scenario meta-reflection that helps a returning learner compare patterns over time.

If introduced, the coach should be a clearly labelled **reflection coach**, not a simulated human facilitator or an authority that decides what was correct. Its contract should be narrow:

- receive only learner-visible evidence, the decision ledger, outcomes, and the current reflection stage;
- ask questions and summarise the learner's stated reasoning; do not recommend a portfolio, generate a causal rule, select an event, grade the learner, infer personality, or modify outcomes;
- disclose uncertainty and cite the simulation evidence it is referring to;
- limit exchanges and provide a non-chat structured fallback; and
- keep reflection content separate from engine state, scorecard inputs, and any future analytics until privacy, retention, and evaluation policies are approved.

Before implementation, the team should require a learner-pilot finding that structured reflection is useful but insufficient, a reflection-quality rubric, grounded-response and unsafe-tone evaluation cases, a transcript/retention decision, a cost/rate-limit plan, and a facilitator review. This preserves the option without making V3 dependent on an unvalidated conversational experience.

### Workshop cadence — proposed interaction design

The 12-quarter horizon should remain because it creates lagged effects and consequence. For a 90-minute facilitated format, it should not require twelve equally deep group debates. A proposed default is four board windows, each resolving three quarters while pausing for evidence or an event when a material condition is met:

1. **Q1–Q3 — diagnose and build foundations:** interpret evidence, commission research, select initial pilots, and record hypotheses.
2. **Q4–Q6 — validate and decide:** review pilot evidence, meet or repair gates, pause/stop, or prepare a scale case.
3. **Q7–Q9 — scale and lead change:** allocate finite capacity, manage rollout and stakeholder response, and respond to an operational disruption.
4. **Q10–Q12 — sustain and reflect:** manage resilience, monitor performance, compare predictions to results, and conduct debrief.

Self-paced mode can expose one quarter at a time; the workshop mode can use the grouped view. This is a proposed UX decision to be tested in the pilot.

## Proposed learning contract

The learner plays an executive transformation lead for a five-plant automotive-component manufacturer. Over a 12-quarter horizon, they must protect tier-one OEM commitments while improving reliability, quality, energy efficiency, and workforce resilience.

### Learning objectives for the first pilot

The objectives below are the proposed formative rubric for the agreed learner cohort:

1. Diagnose which constraints are data/process/people problems versus tool-selection problems.
2. Sequence a portfolio using research, pilot, scale, pause, and stop/defer decisions.
3. Set evidence-based gates for asset-data readiness, safety/workflow integration, and workforce adoption.
4. Explain how chosen initiatives improve one KPI while affecting delivery capacity, cost, trust, or risk elsewhere.
5. Respond to production, quality, and workforce signals with a defensible pivot rather than retrospective rationalisation.

## Scenario model

### Situation and operating constraints

The retained narrative is a ₹2,500 Cr, 7,000-person, five-plant, 24×7 automotive-component supplier with rising downtime, defects, energy pressure, and experienced technician retirement. V2 converts this from headline context into evidence and constraints.

| Constraint | Proposed v2 representation | Learner consequence |
|---|---|---|
| Legacy plant data | Asset-data completeness/quality evidence; plant-by-plant telemetry coverage | Predictive maintenance cannot scale safely before the minimum gate is met. |
| Production commitments | OEM service-level and quality consequences; limited maintenance-window capacity | Short-term output protection can conflict with durable remediation. |
| Skilled technician exits | Workforce-resilience and adoption evidence; technician representative stakeholder | Knowledge capture without trust or time for validation produces weak frontline adoption. |
| Energy cost pressure | Energy price and production-load evidence; efficiency/reliability trade-off | Optimisation value depends on operational stability, not merely model deployment. |
| Delivery capacity | Finite data-engineering, integration, plant-change, and governance capacity | A learner cannot credibly scale every initiative in parallel. |

### Evidence room: first authored artefacts

These are simulated or expert-reviewed learning artefacts, not claims about a named company. Each item must declare author, version, confidence, source type, visibility quarter, and the decisions it informs.

1. Plant performance dashboard: downtime by line/plant, MTBF/MTTR, first-pass yield, PPM defects, OEE, energy per unit, supplier on-time rate.
2. Asset-data assessment: CMMS completeness, sensor coverage, data latency, asset identifiers, quality of failure codes, and data owner.
3. Value-stream map: product flow, planned maintenance windows, inspection point, rework loop, supplier hand-off, and bottleneck line.
4. Workforce brief: retirement risk, shift coverage, training time, safety concerns, tacit-knowledge examples, and works-council/technician feedback.
5. OEM brief: service-level, quality, and traceability requirements; consequence of missed delivery or escaped defects.
6. Finance/capacity brief: capital envelope, run-cost envelope, engineering/change capacity, active-pilot limit, and expected value ranges.
7. Governance brief: data-access controls, cybersecurity baseline, model-validation expectations, incident escalation path, and named accountable roles.

## Portfolio and lifecycle design

The current six initiatives remain. In v2, an initiative has a lifecycle rather than a binary selected/unselected state.

```text
deferred → research → pilot → scale → sustain
                         ↘ pause → resume / stop
```

| Lifecycle state | Typical learner decision | Generic effect | Project Factory example |
|---|---|---|---|
| Deferred | Do not consume delivery capacity yet | No direct benefit; risk/opportunity cost may grow | Postpone supply-risk monitoring to fund a line-stability foundation. |
| Research | Validate problem, data, workflow, and business case | Small cost; reduces uncertainty; unlocks gates | Audit failure codes and sensor coverage before committing predictive maintenance. |
| Pilot | Test a constrained use case with a named owner | Limited value; reveals evidence/adoption signal; consumes capacity | Pilot visual quality on one high-defect line. |
| Scale | Expand an approved pilot into operational workflow | Full value after lag; recurring cost; higher change/governance exposure | Scale maintenance alerts across eligible plants. |
| Sustain | Operate, monitor, retrain, and improve | Maintains realised value; consumes run/maintenance capacity | Maintain alert quality and technician feedback loop. |
| Pause/stop | Stop expansion or exit safely | Frees some capacity; incurs exit/debt/relationship effects when relevant | Pause a low-quality demand forecast after OEM schedule data changes. |

### Portfolio policy

- **No fixed requirement to select three initiatives.** The learner may choose fewer than three when foundations or capacity warrant it.
- **Capacity is separate from budget.** Example capacity classes are data engineering, plant integration, frontline change/training, and governance/assurance.
- **Maximum two active pilots/scales.** Research is visible and has a small cost, but it does not consume one of the two active delivery slots; any research-capacity ceiling is deferred until evidence shows it is needed.
- **Cost is split into research/pilot/scale capital, recurring run cost, and change/assurance effort.** The values remain illustrative until subject-matter calibration.
- **Every scale requires an owner, a gate, and a stop/scale criterion.**

## Initiative design hypotheses

Numbers below are rule-shape proposals, not calibrated business forecasts.

| Initiative | Primary promise | Prerequisites and gate | Secondary trade-off or risk | Indicative causal shape |
|---|---|---|---|---|
| Predictive maintenance | Reduce unplanned downtime and extend asset life | Asset register, failure-code quality, sensor coverage, maintenance-owner sign-off, technician workflow test | False alerts and unplanned work can erode technician trust and maintenance capacity | Research first; pilot effect after one quarter; scaled downtime benefit after two quarters; knowledge assistant strengthens adoption/value. |
| AI visual quality | Improve first-pass yield and prevent escaped defects | Labelled defect images, lighting/camera coverage, inspection process owner, override/rework route | High false rejects add rework; weak traceability threatens OEM trust | Pilot on a high-defect line; quality improvement after one quarter; scales only if false-reject threshold and operator adoption are met. |
| Demand forecasting | Improve raw-material alignment and supply continuity | OEM schedule quality, inventory master accuracy, planner ownership, supplier data-sharing agreement | A confident but poor forecast increases stock-outs or working capital | Research exposes schedule/master-data quality; benefits accrue only with planner adoption and supply partnership. |
| Energy optimisation | Reduce energy intensity while protecting output | Metering coverage, production-load data, operations owner, safe override policy | Aggressive optimisation can conflict with throughput/maintenance windows | Small early insight benefit; scale after reliable telemetry; interacts with maintenance and production schedule. |
| Knowledge assistant | Preserve tacit troubleshooting knowledge and accelerate capability | Consent/IP boundaries, validated knowledge workflow, technician champion, quality review process | Unvalidated advice risks unsafe or inconsistent maintenance actions | Pilot value primarily improves workforce resilience/adoption; operational impact is mediated through maintenance and quality initiatives. |
| Supply-chain risk monitoring | Protect continuity and OEM delivery | Supplier lead-time/quality data, escalation ownership, alternative-sourcing process | Signal volume without action capacity creates alert fatigue | Research first; signals improve continuity only if procurement can act and demand/forecast context is available. |

## Stakeholder model

Stakeholders must shape outcomes through declared response rules; they are not free-form AI characters.

| Stakeholder | Priority / red line | Signals influenced | Example response rule |
|---|---|---|---|
| CFO | Realised value, cash, credible roadmap; no uncontrolled overrun | funding confidence, value score | Blocks a third high-cost scale if capacity and evidence are weak. |
| COO / plant manager | On-time output, safe change windows, line stability | execution capacity, reliability | Accepts scale only where disruption plan and line owner are present. |
| Quality head / OEM account lead | First-pass yield, traceability, escaped-defect avoidance | OEM trust, quality outcome | Escalates a quality event if false rejects or traceability remain poor. |
| Maintenance lead and technician representative | Safe workable maintenance process, knowledge recognition, training time | adoption, workforce resilience, safety trust | Lowers adoption when alerts are imposed without usable workflow or validation. |
| CIO/CISO/data owner | Data quality, access control, operational security | data readiness, governance gate | Pauses data access expansion until asset-data ownership and controls are evidenced. |

## Governance: appropriate but not ornamental

The reference pack should model practical, proportionate controls:

- named business, data, technical, and risk owners;
- data-access and IP boundary for technician knowledge;
- pilot success criteria, test set/validation record, override pathway, and incident escalation;
- workforce and safety review for operational workflow change;
- monitoring for model/alert quality, adoption/overrides, and operational consequences;
- documented decision to scale, pause, or stop.

Governance is a gate for particular actions. It is not a generic compliance percentage that mechanically lowers all risk.

## Event architecture

Events are authored conditions with a stored seed, trigger, probability/range, available evidence, and a post-resolution explanation.

| Event | Trigger example | Learner choice tested | Consequence pattern |
|---|---|---|---|
| Critical line failure | Asset condition remains poor and maintenance pilot/gate is absent or ineffective | emergency continuity versus durable foundation | Immediate delivery and cost loss; later resilience depends on response and maintenance maturity. |
| Quality escape / OEM complaint | Quality risk is elevated; visual-quality process lacks traceability/override route | scale, fix process, or slow rollout | OEM trust and rework pressure change; not just a generic efficiency delta. |
| Technician retirement wave | Workforce resilience/training capacity is low or knowledge transition deferred | retention, co-design/upskill, or external hire | Adoption and maintenance effectiveness change over later quarters. |
| Energy-price spike | External seeded shock after relevant production/telemetry conditions | protect throughput, accelerate energy action, or defer | Energy pressure and financial resilience change; control value depends on telemetry readiness. |
| Supplier schedule disruption | Forecast/supplier data/action capacity is weak | procurement intervention versus inventory buffer versus prioritisation | Supply continuity and working-capital trade-off becomes visible. |

## Formative scorecard

The learner should receive dimensions and evidence, not a hidden master score. The first pilot has no high-stakes composite grade; relative weights, if displayed, are explanatory and subject to calibration.

| Dimension | Evidence | Example Project Factory measures |
|---|---|---|
| Operational outcomes | realised trend versus target | downtime pressure, PPM/first-pass yield, energy intensity, supply continuity |
| Decision quality | evidence reviewed, assumptions, rationale, prediction accuracy | identifies data issue before scale; acknowledges uncertainty |
| Execution and sequencing | appropriate lifecycle, capacity, dependencies, sustained operation | foundation → pilot → scale path; active-work limit honoured |
| Responsible AI / governance | owners, gate evidence, validation, overrides, monitoring, incident action | controlled alert workflow and technician knowledge governance |
| Stakeholder and workforce health | stakeholder response plus adoption/change evidence | technician trust, owner support, OEM confidence |
| Resilience | response to an adverse event and ability to adapt | informed pivot after a quality, capacity, or asset event |

An outcome score may be lower than the quality of a sound decision after an adverse seeded event. The debrief must make that distinction explicit.

## Technical architecture: exact integration points

| Existing seam | V2 responsibility | Proposed implementation boundary |
|---|---|---|
| `lib/scenarios/types.ts` | Optional v2 pack data | Add serializable types for learning, evidence, lifecycle/delivery, rules, stakeholders, gates, events, and rubric. Preserve existing v1 types. |
| `lib/scenarios/projectFactory.ts` | Reference content | Add Project Factory v2 data; do not hard-code behaviour elsewhere. |
| `lib/game/engine.ts:resolveQuarter` | Pure orchestration | Delegate v2 steps to pure resolvers after initiative evolution; preserve v1 path exactly. |
| `lib/game/effectResolver.ts` | Existing direct-effect compatibility | Retain `baseEffect → primaryMetric` for v1/simple packs; introduce `causalRuleResolver` for v2 effects, delays, and trade-offs. |
| `stores/gameStore.ts:confirmDecisions` | Action/state transition | Validate plan, record ledger, call engine, then persist returned state. Keep business rules out of the store. |
| `lib/game/state.ts` and `lib/game/persistence.ts` | Durable, migratable game state | Add v2 state defaults and migrate persistence version 5 to version 6 without altering v1 progress. |
| `components/Game*.tsx` | Learner experience | Add pre-brief/evidence room, initiative-plan controls, concise rationale/prediction capture, scorecard, and debrief. Existing scenario decision view remains the fallback for v1 packs. |
| `lib/llm/advisorPrompt.ts` | Grounded coaching | Supply visible evidence, ledger, gates, and unresolved assumptions. Prevent selection/scoring claims. |
| `tests/*` | Determinism and regression | Add pack validation, resolver, migration, known-seed fixtures, and browser flows. Preserve all current v1/Standard tests. |

### Proposed pure-module boundary

```text
lib/game/v2/
  validation.ts        pack and decision validation
  portfolio.ts         budget, capacity, lifecycle and dependencies
  ledger.ts            recorded rationale, prediction and ownership
  governance.ts        gates, evidence and operating controls
  causalRules.ts       delayed/conditional effects and seeded ranges
  events.ts            eligible event selection and resolution
  stakeholders.ts      declared stakeholder responses
  scorecard.ts         visible assessment components and debrief evidence
```

`resolveQuarter` remains the orchestrator. It should return a complete immutable snapshot as it does today; V2-specific state must live inside `ScenarioState` or a named serializable child object, never as runtime functions in state.

## Thin vertical slice: recommended implementation scope

Do not build every planned feature at once. The first working Project Factory v2 slice should include:

1. scenario v2 schema and pack validator;
2. pre-brief with four evidence artefacts and known unknowns;
3. lifecycle choice for **research, pilot, scale, pause/defer**;
4. explicit delivery capacity and one prerequisite gate per initiative;
5. a decision ledger with rationale, prediction, owner, and scale gate;
6. three representative causal-rule shapes: a delayed benefit, a trade-off, and a dependency;
7. one condition-triggered line-failure event with authored explanation;
8. a five-part visible scorecard and structured debrief;
9. migration plus deterministic pure/E2E tests.

Defer detailed multi-stakeholder negotiation, multiple variants per event, full counterfactual simulation, and sophisticated probabilistic calibration until this slice has been reviewed with learners and a manufacturing subject-matter expert.

## Remaining design decisions before implementation

| Decision | Proposed default | Why it matters |
|---|---|---|
| Workshop cadence | Four decision windows over twelve quarters | Determines orchestration/UI complexity and facilitation guide design. |
| Initial scorecard display | Dimension ratings and evidence, no composite score | Preserves formative use while still showing progress. |
| Active-work capacity types | Data engineering, plant integration, frontline change, governance/assurance | Determines whether capacity mechanics are understandable enough for the target learner. |
| Manufacturing reviewers | One operations/maintenance SME plus one learning-design reviewer | Required to calibrate synthetic evidence, rules, and debrief quality. |
| LLM role | Grounded coach only; no selection, scoring, or outcome generation | Preserves explainability and testability. |

The agreed decisions and detailed engineering tasks are reflected in [Project Factory v2 Implementation Backlog](./project-factory-v2-implementation-backlog.md). The reusable content structure is [Scenario v2 Content-Authoring Template](./scenario-v2-content-authoring-template.md).
