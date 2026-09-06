import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import crypto from 'node:crypto';
import { createJsonTable } from '@/lib/db';
import { notConfiguredProvider } from '@/core/providers/not-configured-provider';
import { createAnthropicProvider } from '@/core/providers/anthropic-provider';
import type { AIMessage } from '@/core/providers/types';

interface ConversationRecord {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const conversationsTable = createJsonTable<ConversationRecord>(DATA_DIR, 'conversations');

function getProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return notConfiguredProvider;
  return createAnthropicProvider({ apiKey, model: process.env.ANTHROPIC_MODEL });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { conversationId?: string; messages: AIMessage[] };

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'Thiếu messages trong request.' }, { status: 400 });
  }

  const provider = getProvider();
  const result = await provider.complete({ messages: body.messages });

  const now = new Date().toISOString();
  let conversationId = body.conversationId;

  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await conversationsTable.insert({
      id: conversationId,
      title: body.messages[0]?.content.slice(0, 60) ?? 'Cuộc trò chuyện mới',
      messages: body.messages,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const existing = await conversationsTable.get(conversationId);
    await conversationsTable.update(conversationId, {
      messages: [...(existing?.messages ?? []), ...body.messages.slice(existing?.messages.length ?? 0)],
      updatedAt: now,
    });
  }

  if (!result.ok) {
    // Trả về lỗi RÕ RÀNG, không giả vờ đây là câu trả lời AI.
    return NextResponse.json({ conversationId, error: result.message, errorCode: result.errorCode }, { status: 200 });
  }

  await conversationsTable.update(conversationId, {
    messages: [...body.messages, { role: 'assistant', content: result.content }],
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ conversationId, content: result.content, model: result.model });
}
