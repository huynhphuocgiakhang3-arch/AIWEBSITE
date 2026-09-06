import type { AgentTool } from '../types.ts';
import { analyzeFiles, summarize } from '../../diagnostics/rules.ts';

/**
 * Tool cho agent: chạy diagnostics rules THẬT trên một tập file (đã đọc sẵn
 * nội dung), trả về issue thật kèm số liệu tổng hợp thật — không có điểm
 * số "AI accuracy" bịa ra.
 *
 * Input là JSON string dạng: [{ "path": "...", "content": "..." }, ...]
 */
export function createRunDiagnosticsTool(): AgentTool {
  return {
    name: 'run_diagnostics',
    description: 'Chạy các luật kiểm tra tĩnh (no-any, no-ts-ignore, zip-slip, secret hardcode, ...) trên nội dung file được cung cấp.',
    run: (input: string) => {
      let files: Array<{ path: string; content: string }>;
      try {
        files = JSON.parse(input);
      } catch {
        return 'Lỗi: input phải là JSON array dạng [{ "path": "...", "content": "..." }]';
      }

      const issues = analyzeFiles(files);
      const summary = summarize(issues);

      if (issues.length === 0) {
        return `Không phát hiện vấn đề nào trên ${files.length} file được kiểm tra.`;
      }

      const lines = issues
        .slice(0, 50) // giới hạn hiển thị để tránh phản hồi quá dài
        .map((i) => `[${i.severity.toUpperCase()}] ${i.file}:${i.line} — ${i.ruleId}: ${i.description}`);

      return [
        `Tổng: ${summary.totalIssues} vấn đề (error: ${summary.bySeverity.error}, warning: ${summary.bySeverity.warning}, info: ${summary.bySeverity.info})`,
        ...lines,
        issues.length > 50 ? `... và ${issues.length - 50} vấn đề khác (đã cắt bớt hiển thị)` : '',
      ]
        .filter(Boolean)
        .join('\n');
    },
  };
}
