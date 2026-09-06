import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { createJsonTable } from '../../../../lib/db';

interface ConversationRecord {
  id: string;
  title: string;
  messages: unknown[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const conversationsTable = createJsonTable<ConversationRecord>(DATA_DIR, 'conversations');

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conversation = await conversationsTable.get(params.id);
  if (!conversation) {
    return NextResponse.json({ error: 'Không tìm thấy conversation.' }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const removed = await conversationsTable.remove(params.id);
  if (!removed) {
    return NextResponse.json({ error: 'Không tìm thấy conversation.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
