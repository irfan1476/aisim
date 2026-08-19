'use client';

import { useMemo, useState } from 'react';
import AnalyticsHub from './AnalyticsHub';
import GameAssessmentScreen from './GameAssessmentScreen';
import GameDecisionView from './GameDecisionView';
import GameDoneScreen from './GameDoneScreen';
import GameResultsModal from './GameResultsModal';
import GameSetupScreen from './GameSetupScreen';
import type { GameCrisis, GameInitiative, GameViewState, Metric } from './gameViewTypes';
import { useLLMStore } from '../stores/llmStore';
import { causalChain } from '../lib/game/metrics';
import { generateProactiveRecommendations } from '../lib/game/recommendations';
import { calculateBCGScore } from '../lib/game/scoring';
import { initializeInitiativeStates } from '../lib/game/initiativeState';
import { useGameStore } from '../stores/gameStore';
import NextQuarterGuidance from './NextQuarterGuidance';
import QuarterRoadmap from './QuarterRoadmap';

const initiatives: GameInitiative[] = [
  { id: 'maintenance', name: 'Predictive Maintenance', desc: 'Predict component failures weeks in advance.', cost: 2.8, roi: 187, risk: 'MED', data: 4, human: 3, impact: 'Cuts downtime and extends asset life.' },
  { id: 'quality', name: 'AI Visual Quality', desc: 'Detect defects in real time on the line.', cost: 2.1, roi: 164, risk: 'LOW', data: 3, human: 2, impact: 'Improves first-pass yield and OEM trust.' },
  { id: 'demand', name: 'Demand Forecasting', desc: 'Align raw stock with OEM pull schedules.', cost: 1.5, roi: 142, risk: 'LOW', data: 5, human: 4, impact: 'Reduces inventory volatility.' },
  { id: 'energy', name: 'Energy Optimization', desc: 'Use AI to offset rising energy costs.', cost: 1.8, roi: 156, risk: 'LOW', data: 3, human: 3, impact: 'Improves efficiency across five plants.' },
  { id: 'knowledge', name: 'AI Knowledge Assistant', desc: 'Capture IP from retiring technicians.', cost: 1.2, roi: 198, risk: 'HIGH', data: 2, human: 5, impact: 'Builds resilience and workforce confidence.' },
  { id: 'supply', name: 'Supply Chain Risk', desc: 'Flag supplier delivery issues early.', cost: 2.3, roi: 134, risk: 'MED', data: 4, human: 3, impact: 'Protects tier-one OEM commitments.' },
];

const crises: GameCrisis[] = [
  { title: 'A competitor launches an AI-native quality platform.', type: 'MARKET PRESSURE', text: 'Your largest OEM has asked how quickly Project Factory can match the new standard.', options: [['Accelerate R&D', 'Invest $2M in a rapid response lab.', { roi: 5, innovation: 8 }], ['Pivot the roadmap', 'Focus the existing team on the highest-value line.', { risk: -5, efficiency: 4 }], ['Hire specialists', 'Bring in an external team for $1M.', { data: 5, roi: 3 }]] },
  { title: 'A near-miss exposes a data access gap.', type: 'GOVERNANCE ALERT', text: 'No customer data was lost, but the board wants evidence that controls are improving.', options: [['Security audit', 'Fund a full controls review.', { risk: -12, compliance: 10 }], ['Transparent update', 'Communicate the remediation plan.', { adoption: 4, risk: -4 }], ['Investigate quietly', 'Protect focus and fix the root cause.', { risk: -6, data: 3 }]] },
  { title: 'Two senior technicians announce retirement.', type: 'TALENT SIGNAL', text: 'Their tacit knowledge is essential to keeping the plants running smoothly.', options: [['Retention bonuses', 'Keep them through the transition.', { satisfaction: 8, turnover: -6 }], ['Upskill the bench', 'Accelerate knowledge transfer and training.', { literacy: 10, adoption: 5 }], ['Recruit externally', 'Add experienced operators to the team.', { satisfaction: 3, innovation: 4 }]] },
];

function initial(): GameViewState {
  return { q: 1, stage: 'decide', selected: ['demand', 'energy'], alloc: { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 }, roi: 0, revenue: 0, efficiency: 8, adoption: 38, risk: 36, data: 54, satisfaction: 61, literacy: 35, turnover: 14, compliance: 62, innovation: 42, spent: 0, score: 0, history: [], achievements: [], crisis: null, feedback: 'The board is watching for a balanced portfolio. You have room to build momentum.', causalChain: [], proactiveRecommendations: [], approvedRecommendations: [], nextQuarterGuidance: null, baseline: [], experimental: false, initiativeStates: initializeInitiativeStates() };
}

function compactNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export default function Game() {
  const store = useGameStore();
  const s = store as unknown as GameViewState;
  const [name, setName] = useState('');
  const [screen, setScreen] = useState<'setup' | 'assessment' | 'game' | 'done'>('setup');
  const [persona, setPersona] = useState('CFO');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [assessment, setAssessment] = useState<number[]>([]);
  const [experimental, setExperimental] = useState(false);
  const total = useMemo(() => Object.values(s.alloc).reduce((a, b) => a + b, 0), [s.alloc]);
  const liveInitiatives = useMemo(() => initiatives.map((initiative) => { const live = s.initiativeStates?.[initiative.id]; return { ...initiative, roi: compactNumber(live?.currentRoi ?? initiative.roi), data: compactNumber(live?.currentData ?? initiative.data), cost: compactNumber(live?.currentCost ?? initiative.cost), risk: live?.currentRisk ?? initiative.risk }; }), [s.initiativeStates]);

  const metrics: Metric[] = [['ROI', 'roi', '%', 'gold'], ['Revenue uplift', 'revenue', '%', 'emerald'], ['Efficiency', 'efficiency', '%', 'blue'], ['Adoption', 'adoption', '%', 'purple'], ['Risk exposure', 'risk', '%', 'red'], ['Data readiness', 'data', '%', 'cyan']].map(([label, key, unit, color]) => ({ label, value: s[key as keyof GameViewState] as number, unit, color: color as Metric['color'] }));
  const toggle = (id: string) => store.selectInitiatives(s.selected.includes(id) ? s.selected.filter(i => i !== id) : s.selected.length < 3 ? [...s.selected, id] : s.selected);
  const updateAlloc = (key: string, value: number) => store.updateAllocation(key as 'infra' | 'data' | 'people' | 'mlops' | 'compliance' | 'innovation', value);
  const llm = useLLMStore();
  const ask = async () => { if (!question.trim() || isAsking) return; const userQuestion = question; setQuestion(''); setAnswer(''); setIsAsking(true); const replies: Record<string, string> = { CFO: `At ${s.roi.toFixed(1)}% ROI and $${s.spent.toFixed(1)}M spent, your next question is payback. Keep people above 15% to protect value realization.`, CTO: `Data readiness is ${s.data}%. The portfolio is viable, but MLOps and data engineering should rise before you scale the high-risk assistant.`, CHRO: `Adoption is ${s.adoption}%. Your people allocation is ${s.alloc.people}%; invest in enablement if you want the transformation to stick.`, RISK: `Risk exposure is ${s.risk}%, while compliance is ${s.compliance}%. A governance buffer now is cheaper than a crisis later.` }; try { const response = await fetch('/api/llm/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...llm, messages: [{ role: 'system', content: `You are the ${persona} board advisor in an executive AI investment simulation. Reply in plain text only, under 120 words, using exactly these labels: Recommendation:, Why:, Next step:. Do not use Markdown, headings, or repeat the question. Be concise and actionable. Current state: ${JSON.stringify({ ...s, advisorContext: { recentHistory: s.history?.slice(-3) || [], selected: s.selected || [], allocation: s.alloc || {}, causalChain: s.causalChain || [], recommendations: s.proactiveRecommendations || [] } })}` }, { role: 'user', content: userQuestion }] }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setAnswer(data.content || replies[persona]); setIsAsking(false); } catch { setAnswer(replies[persona]); setIsAsking(false); } };
  const confirm = () => store.confirmDecisions();
  const respond = (impact: Record<string, number>) => store.respondToCrisis(impact);
  const advance = () => { if (s.q >= 12) { setScreen('done'); return; } store.advanceQuarter(); };
  const reset = () => { store.resetCampaign(); setScreen('setup'); };

  if (screen === 'setup') return <GameSetupScreen name={name} experimental={experimental} onNameChange={setName} onExperimentalChange={setExperimental} onContinue={() => setScreen('assessment')} />;
  if (screen === 'assessment') return <GameAssessmentScreen assessment={assessment} onAssessmentChange={(index, value) => setAssessment(current => { const next = [...current]; next[index] = value; return next; })} onComplete={() => { const fresh = initial(); store.resetCampaign(); store.loadGame({ ...fresh, baseline: assessment, experimental }); setScreen('game'); }} canContinue={assessment.length === 5} analytics={<AnalyticsHub state={s} initiatives={initiatives} />} />;
  if (screen === 'done') return <GameDoneScreen state={s} onPlayAgain={reset} />;
  return <main className="game-shell min-h-screen bg-mist"><NextQuarterGuidance guidance={s.nextQuarterGuidance} onApply={store.applyRecommendation} onDismiss={store.dismissRecommendation}/><div className="game-roadmap order-2 mx-auto max-w-[1500px] px-5 pt-5"><QuarterRoadmap state={s}/></div><GameDecisionView state={s} initiatives={liveInitiatives} metrics={metrics} total={total} persona={persona} answer={answer} question={question} isAsking={isAsking} onPersonaChange={setPersona} onQuestionChange={setQuestion} onAsk={ask} onToggleInitiative={toggle} onAllocationChange={updateAlloc} onConfirm={confirm} onReset={reset} /><GameResultsModal state={s} onRespond={respond} onAdvance={advance} onApproveRecommendation={store.approveRecommendation} /></main>;
}
