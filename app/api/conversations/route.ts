import { NextResponse } from 'next/server';
import path from 'node:path';
import { createJsonTable } from '../../../lib/db';

interface ConversationRecord {
  id: string;
  title: string;
  messages: unknown[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = process.env.HPGK_DATA_DIR ?? path.join(process.cwd(), 'data');
const conversationsTable = createJsonTable<ConversationRecord>(DATA_DIR, 'conversations');

export async function GET() {
  const all = await conversationsTable.all();
  // Trả về danh sách rút gọn (không kèm toàn bộ messages) cho sidebar lịch sử
  const summaries = all
    .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ conversations: summaries });
}
