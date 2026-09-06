import type { AgentTool } from '../types.ts';
import type { KnowledgeEntry } from '../../knowledge/types.ts';
import { retrieve } from '../../knowledge/retrieval.ts';

/**
 * Tool cho agent: tìm kiếm Knowledge Core thật (retrieval engine offline-first),
 * không gọi AI, không bịa kết quả — nếu không có entry liên quan, trả lời
 * rõ ràng là không tìm thấy.
 */
export function createSearchKnowledgeTool(entries: KnowledgeEntry[]): AgentTool {
  return {
    name: 'search_knowledge',
    description: 'Tìm kiếm trong Knowledge Core theo từ khoá, trả về các khái niệm liên quan nhất kèm nguồn gốc.',
    run: (input: string) => {
      const results = retrieve(entries, { text: input, limit: 3 });
      if (results.length === 0) {
        return `Không tìm thấy mục tri thức nào liên quan tới: "${input}"`;
      }
      return results
        .map(
          (r) =>
            `[${r.entry.id}] ${r.entry.title} (domain: ${r.entry.domain}, độ liên quan: ${(r.score * 100).toFixed(0)}%)\n${r.entry.concept}`
        )
        .join('\n\n');
    },
  };
}
