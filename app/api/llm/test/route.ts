import { NextResponse } from 'next/server';
import { chat, extractText } from '../../../../lib/llm/providers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await chat({ ...body, messages: [{ role: 'user', content: 'Reply with exactly: Connection successful.' }] });
    return NextResponse.json({ content: extractText(body.provider, data) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Connection failed.' }, { status: 502 }); }
}
