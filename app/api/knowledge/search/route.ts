import { NextRequest, NextResponse } from 'next/server';
import { loadKnowledgeBase } from '../../../../core/knowledge/index';
import { retrieve, getKnowledgeStats } from '../../../../core/knowledge/retrieval';
import type { KnowledgeDomain } from '../../../../core/knowledge/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const domain = searchParams.get('domain') as KnowledgeDomain | null;

  const { entries, issues } = await loadKnowledgeBase();

  if (!query.trim()) {
    return NextResponse.json({ stats: getKnowledgeStats(entries), results: [], loadIssues: issues });
  }

  const results = retrieve(entries, { text: query, domain: domain ?? undefined, limit: 10 });
  return NextResponse.json({
    stats: getKnowledgeStats(entries),
    results: results.map((r) => ({ entry: r.entry, score: r.score, matchedFields: r.matchedFields })),
    loadIssues: issues,
  });
}
