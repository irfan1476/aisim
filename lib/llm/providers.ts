import type { LLMProvider } from '../../stores/llmStore';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ChatInput = { provider: LLMProvider; apiKey?: string; model: string; temperature: number; localLLMUrl?: string; messages: ChatMessage[] };

async function jsonFetch(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json();
}

export async function chat(input: ChatInput) {
  const { provider, apiKey, model, temperature, messages } = input;
  if (provider === 'llama') {
    return jsonFetch(input.localLLMUrl || 'http://127.0.0.1:8080/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, temperature, messages }) });
  }
  if (!apiKey) throw new Error('Add an API key for this provider.');
  if (provider === 'openai' || provider === 'opencode') {
    const base = provider === 'opencode' ? 'https://api.opencode.com/v1' : 'https://api.openai.com/v1';
    return jsonFetch(`${base}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature, messages }) });
  }
  if (provider === 'gemini') {
    const contents = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const system = messages.find((m) => m.role === 'system')?.content;
    return jsonFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: system ? { parts: [{ text: system }] } : undefined, contents, generationConfig: { temperature } }) });
  }
  return jsonFetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 700, temperature, system: messages.find((m) => m.role === 'system')?.content, messages: messages.filter((m) => m.role !== 'system') }) });
}

export function extractText(provider: LLMProvider, data: any) {
  if (provider === 'gemini') return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
  if (provider === 'claude') return data?.content?.map((p: any) => p.text).join('') || '';
  return data?.choices?.[0]?.message?.content || '';
}
