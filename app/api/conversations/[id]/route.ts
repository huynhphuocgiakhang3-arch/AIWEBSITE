import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { createJsonTable } from '../../../../lib/db';
import type { ConversationRecord, ConversationMessage } from '../route';

const table = createJsonTable<ConversationRecord>(process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data'), 'conversations');

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conversation = await table.get(params.id);
  if (!conversation) return NextResponse.json({ error: 'Không tìm thấy cuộc trò chuyện.' }, { status: 404 });
  return NextResponse.json({ conversation });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const conversation = await table.get(params.id);
  if (!conversation) return NextResponse.json({ error: 'Không tìm thấy cuộc trò chuyện.' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const message = body.message as ConversationMessage | undefined;
  if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
    return NextResponse.json({ error: 'Message không hợp lệ.' }, { status: 400 });
  }
  const updated = await table.update(params.id, {
    messages: [...conversation.messages, message],
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ conversation: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await table.remove(params.id))) return NextResponse.json({ error: 'Không tìm thấy cuộc trò chuyện.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
