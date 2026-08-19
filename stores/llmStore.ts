'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LLMProvider = 'openai' | 'gemini' | 'claude' | 'opencode' | 'llama';

type LLMState = {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  temperature: number;
  localLLMUrl: string;
  set: (values: Partial<Omit<LLMState, 'set'>>) => void;
  clearKey: () => void;
};

export const providerDefaults: Record<LLMProvider, { label: string; model: string; models: string[] }> = {
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o'] },
  gemini: { label: 'Gemini', model: 'gemini-1.5-flash', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
  claude: { label: 'Claude', model: 'claude-3-5-sonnet-latest', models: ['claude-3-5-sonnet-latest', 'claude-3-haiku-20240307'] },
  opencode: { label: 'OpenCode', model: 'opencode-7b', models: ['opencode-7b'] },
  llama: { label: 'llama.cpp', model: 'llama3-8b', models: ['llama3-8b', 'local-model'] },
};

export const useLLMStore = create<LLMState>()(persist((set) => ({
  provider: 'openai', apiKey: '', model: providerDefaults.openai.model, temperature: 0.7,
  localLLMUrl: 'http://127.0.0.1:8080/v1/chat/completions',
  set: (values) => set(values), clearKey: () => set({ apiKey: '' }),
}), { name: 'ai-investment-llm-settings' }));
