'use client';

import { useState } from 'react';
import { CheckCircle2, LockKeyhole, Plug, Trash2 } from 'lucide-react';
import { providerDefaults, useLLMStore, type LLMProvider } from '../stores/llmStore';

export default function LLMSettings() {
  const settings = useLLMStore();
  const [status, setStatus] = useState('');
  const current = providerDefaults[settings.provider];
  const test = async () => {
    setStatus('Testing…');
    try {
      const response = await fetch('/api/llm/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus('Connection successful');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Connection failed'); }
  };
  return <div className="rounded-2xl border border-ink/8 bg-white p-4">
    <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-gold">Advisor engine</p><h3 className="mt-1 font-bold">Choose your AI partner</h3></div><Plug size={17} className="text-gold" /></div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{(Object.keys(providerDefaults) as LLMProvider[]).map((provider) => <button key={provider} onClick={() => settings.set({ provider, model: providerDefaults[provider].model })} className={`rounded-lg border px-2 py-2 text-xs font-bold ${settings.provider === provider ? 'border-gold bg-gold/15 text-ink' : 'border-ink/10 text-ink/55'}`}>{providerDefaults[provider].label}</button>)}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-ink/55">Model<select value={settings.model} onChange={(e) => settings.set({ model: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-mist px-3 py-2 text-sm">{current.models.map((model) => <option key={model}>{model}</option>)}</select></label><label className="text-xs font-bold text-ink/55">Temperature <span className="font-normal">{settings.temperature.toFixed(1)}</span><input type="range" min="0" max="1" step=".1" value={settings.temperature} onChange={(e) => settings.set({ temperature: Number(e.target.value) })} className="mt-3 w-full accent-[#D4AF37]" /></label></div>
    {settings.provider === 'llama' ? <label className="mt-3 block text-xs font-bold text-ink/55">Local endpoint<input value={settings.localLLMUrl} onChange={(e) => settings.set({ localLLMUrl: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-mist px-3 py-2 text-sm" /></label> : <label className="mt-3 block text-xs font-bold text-ink/55">API key<input type="password" value={settings.apiKey} onChange={(e) => settings.set({ apiKey: e.target.value })} placeholder="Stored locally in this browser" className="mt-1 w-full rounded-lg border border-ink/10 bg-mist px-3 py-2 text-sm" /></label>}
    <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={test} className="rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white">Test connection</button>{settings.apiKey && <button onClick={settings.clearKey} className="flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-2 text-xs font-bold text-ink/55"><Trash2 size={13}/> Clear key</button>}{status && <span className="flex items-center gap-1 text-xs text-emerald"><CheckCircle2 size={13}/> {status}</span>}</div>
    <p className="mt-3 flex gap-2 text-[11px] leading-5 text-ink/45"><LockKeyhole size={13} className="mt-0.5 shrink-0" /> Your key is persisted in this browser and is only forwarded to the selected provider when you test or ask the advisor. It is not stored by this app.</p>
  </div>;
}
