import { NextResponse } from 'next/server';
import { chat, extractText } from '../../../../lib/llm/providers';
import type { LLMProvider } from '../../../../stores/llmStore';

const providers = new Set<LLMProvider>(['openai', 'gemini', 'claude', 'opencode', 'llama']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!providers.has(body.provider) || !Array.isArray(body.messages)) return NextResponse.json({ error: 'Invalid provider or messages.' }, { status: 400 });
    const data = await chat(body);
    return NextResponse.json({ content: extractText(body.provider, data), provider: body.provider, model: body.model });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Provider unavailable.' }, { status: 502 });
  }
}
