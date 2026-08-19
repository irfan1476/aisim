// lib/llm/providers.ts
import type { LLMProvider } from '../../stores/llmStore';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ChatInput = {
  provider: LLMProvider;
  apiKey?: string;
  model: string;
  temperature: number;
  localLLMUrl?: string;
  messages: ChatMessage[];
};

async function jsonFetch(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider returned ${response.status}: ${text}`);
  }
  return response.json();
}

export async function chat(input: ChatInput) {
  const { provider, apiKey, model, temperature, messages } = input;

  // --- LLAMA (Ollama or llama.cpp) ---
  if (provider === 'llama') {
    let url = input.localLLMUrl || 'http://127.0.0.1:11434/api/chat';
    if (url.endsWith('/v1/chat/')) url = `${url}completions`;
    if (url.endsWith('/v1/chat')) url = `${url}/completions`;

    // Detect Ollama by URL (port 11434 or /api/chat in path)
    const isOllama = url.includes('11434') || url.includes('/api/chat');

    let body: any;
    let headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (isOllama) {
      // --- OLLAMA FORMAT ---
      // Ollama doesn't use temperature in the same way; we'll include it in options
      body = {
        model: model,
        messages: messages,
        stream: false,
        options: {
          temperature: temperature,
          num_predict: 350,
        },
      };
    } else {
      // --- OPENAI-COMPATIBLE (llama.cpp with --api) ---
      body = {
        model: model,
        messages: messages,
        temperature: temperature,
        stream: false,
      };
    }

    return jsonFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  // --- OTHER PROVIDERS (OpenAI, Gemini, Claude, OpenCode) ---
  if (!apiKey) throw new Error('Add an API key for this provider.');

  if (provider === 'openai' || provider === 'opencode') {
    const base = provider === 'opencode' ? 'https://api.opencode.com/v1' : 'https://api.openai.com/v1';
    return jsonFetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, temperature, messages }),
    });
  }

  if (provider === 'gemini') {
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const system = messages.find((m) => m.role === 'system')?.content;
    return jsonFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
          generationConfig: { temperature },
        }),
      }
    );
  }

  // Claude
  return jsonFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      temperature,
      system: messages.find((m) => m.role === 'system')?.content,
      messages: messages.filter((m) => m.role !== 'system'),
    }),
  });
}

export function extractText(provider: LLMProvider, data: any): string {
  // --- OLLAMA FORMAT ---
  if (provider === 'llama') {
    // Try OpenAI format first (llama.cpp with --api)
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    // Try Ollama format
    if (data?.message?.content) {
      return data.message.content;
    }
    // Try other common formats
    if (data?.response) return data.response;
    if (data?.text) return data.text;
    if (data?.content) return data.content;
    return '';
  }

  // --- GEMINI ---
  if (provider === 'gemini') {
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
  }

  // --- CLAUDE ---
  if (provider === 'claude') {
    return data?.content?.map((p: any) => p.text).join('') || '';
  }

  // --- OPENAI / OPENDCODE ---
  return data?.choices?.[0]?.message?.content || '';
}
