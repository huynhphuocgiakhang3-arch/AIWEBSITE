import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { createJsonTable } from '../../../lib/db';

export interface ConversationMessage { role: 'user' | 'assistant'; content: string; }
export interface ConversationRecord { id: string; title: string; messages: ConversationMessage[]; createdAt: string; updatedAt: string; }

const table = createJsonTable<ConversationRecord>(process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data'), 'conversations');

export async function GET() {
  const conversations = (await table.all())
    .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'Thiếu message.' }, { status: 400 });
  const now = new Date().toISOString();
  const record: ConversationRecord = {
    id: crypto.randomUUID(),
    title: message.slice(0, 72),
    messages: [{ role: 'user', content: message }],
    createdAt: now,
    updatedAt: now,
  };
  await table.insert(record);
  return NextResponse.json({ conversation: record });
}
