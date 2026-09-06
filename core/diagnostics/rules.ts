/**
 * core/diagnostics/rules.ts
 *
 * Diagnostics engine THẬT ở mức "static heuristic checks trên text nguồn" —
 * KHÔNG phải AST-level type checker đầy đủ (việc đó cần TypeScript compiler
 * API, một dependency ngoài). Đây là các luật rõ ràng, minh bạch, không có
 * gì "AI" giả vờ đằng sau — mỗi luật là một hàm thuần kiểm tra text.
 *
 * Đúng theo yêu cầu gốc: "không @ts-ignore, không any, không non-null
 * assertion, không workaround" — các luật ở đây phát hiện chính xác những
 * việc đó khi chúng xuất hiện trong code được phân tích.
 */

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface DiagnosticIssue {
  ruleId: string;
  severity: IssueSeverity;
  file: string;
  line: number;
  description: string;
  cause: string;
  suggestedFix: string;
  /** Mức độ chắc chắn của rule này (0-100) — heuristic đơn giản có thể có false positive */
  confidence: number;
}

export interface DiagnosticRule {
  id: string;
  severity: IssueSeverity;
  description: string;
  cause: string;
  suggestedFix: string;
  confidence: number;
  /** Trả về true nếu dòng code này vi phạm rule */
  test: (line: string) => boolean;
  /** Chỉ áp dụng rule cho các file có đuôi này, ví dụ ['.ts', '.tsx'] */
  applicableExtensions: string[];
}

function extOf(filePath: string): string {
  const idx = filePath.lastIndexOf('.');
  return idx === -1 ? '' : filePath.slice(idx).toLowerCase();
}

export const RULES: DiagnosticRule[] = [
  {
    id: 'no-ts-ignore',
    severity: 'error',
    description: '@ts-ignore che giấu lỗi type thay vì sửa gốc rễ',
    cause: 'Code dùng @ts-ignore để bỏ qua lỗi TypeScript mà không giải quyết nguyên nhân',
    suggestedFix: 'Sửa đúng kiểu dữ liệu, hoặc dùng @ts-expect-error kèm comment giải thích rõ lý do tạm thời nếu thực sự cần',
    confidence: 95,
    applicableExtensions: ['.ts', '.tsx'],
    test: (line) => /@ts-ignore/.test(line),
  },
  {
    id: 'no-explicit-any',
    severity: 'warning',
    description: "Sử dụng kiểu 'any' làm mất khả năng kiểm tra type của TypeScript",
    cause: "Khai báo tường minh ': any' hoặc 'as any'",
    suggestedFix: 'Định nghĩa interface/type cụ thể, hoặc dùng unknown kèm type guard nếu kiểu thực sự chưa xác định',
    confidence: 80,
    applicableExtensions: ['.ts', '.tsx'],
    test: (line) => /:\s*any\b/.test(line) || /\bas\s+any\b/.test(line),
  },
  {
    id: 'no-non-null-assertion',
    severity: 'warning',
    description: 'Non-null assertion (!) có thể che giấu giá trị null/undefined thực sự tồn tại',
    cause: "Dùng dấu '!' để khẳng định giá trị không null/undefined mà không kiểm tra runtime",
    suggestedFix: 'Dùng optional chaining (?.) kèm xử lý trường hợp undefined, hoặc kiểm tra tường minh trước khi truy cập',
    confidence: 70,
    applicableExtensions: ['.ts', '.tsx'],
    test: (line) => /[a-zA-Z0-9_\)\]]\!\s*[\.\;\,\)\]]/.test(line) && !/!=/.test(line),
  },
  {
    id: 'no-console-log',
    severity: 'info',
    description: 'console.log còn sót lại trong code, có thể là code debug tạm thời',
    cause: 'Lời gọi console.log/console.debug xuất hiện trong source',
    suggestedFix: 'Xoá bỏ trước khi merge, hoặc thay bằng logger có cấp độ (info/warn/error) có thể tắt ở production',
    confidence: 60,
    applicableExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    test: (line) => /console\.(log|debug)\(/.test(line),
  },
  {
    id: 'todo-fixme-marker',
    severity: 'info',
    description: 'Comment TODO/FIXME đánh dấu công việc chưa hoàn thành',
    cause: 'Tìm thấy chuỗi TODO hoặc FIXME trong comment',
    suggestedFix: 'Theo dõi bằng issue tracker thay vì để rải rác trong code, hoặc hoàn thành trước khi release',
    confidence: 90,
    applicableExtensions: ['.ts', '.tsx', '.js', '.jsx', '.md'],
    test: (line) => /\b(TODO|FIXME)\b/.test(line),
  },
  {
    id: 'hardcoded-secret-pattern',
    severity: 'error',
    description: 'Chuỗi trông giống API key/secret bị hardcode trực tiếp trong source',
    cause: "Phát hiện pattern giống key (ví dụ 'sk-', 'AKIA', chuỗi hex/base64 dài gán trực tiếp cho biến có tên chứa key/secret/token/password)",
    suggestedFix: 'Chuyển sang biến môi trường (.env, không commit) và đọc qua process.env',
    confidence: 55,
    applicableExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.env'],
    test: (line) =>
      /\b(sk-[a-zA-Z0-9]{16,}|AKIA[0-9A-Z]{12,})\b/.test(line) ||
      (/(api[_-]?key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i.test(line) &&
        !/process\.env/.test(line)),
  },
  {
    id: 'extract-all-without-validation',
    severity: 'error',
    description: 'Giải nén ZIP không qua kiểm tra an toàn (zip slip / path traversal)',
    cause: "Gọi trực tiếp extractAllTo()/extractAll() mà không thấy lời gọi kiểm tra entry trước đó trong cùng ngữ cảnh",
    suggestedFix: 'Dùng core/security/zip-guard.ts để validate từng entry (path traversal, symlink, kích thước) TRƯỚC khi ghi ra đĩa',
    confidence: 50,
    applicableExtensions: ['.ts', '.js'],
    test: (line) => /\.extractAllTo\(|\.extractAll\(/.test(line),
  },
];

/** Phân tích nội dung một file, trả về danh sách issue thật (không bịa). */
export function analyzeFile(filePath: string, content: string): DiagnosticIssue[] {
  const ext = extOf(filePath);
  const applicableRules = RULES.filter((r) => r.applicableExtensions.includes(ext));
  if (applicableRules.length === 0) return [];

  const lines = content.split('\n');
  const issues: DiagnosticIssue[] = [];

  lines.forEach((lineText, idx) => {
    for (const rule of applicableRules) {
      if (rule.test(lineText)) {
        issues.push({
          ruleId: rule.id,
          severity: rule.severity,
          file: filePath,
          line: idx + 1,
          description: rule.description,
          cause: rule.cause,
          suggestedFix: rule.suggestedFix,
          confidence: rule.confidence,
        });
      }
    }
  });

  return issues;
}

export interface DiagnosticsSummary {
  totalIssues: number;
  bySeverity: Record<IssueSeverity, number>;
  byRule: Record<string, number>;
}

/** Tổng hợp số liệu THẬT từ danh sách issue đã phát hiện — không phải điểm số bịa. */
export function summarize(issues: DiagnosticIssue[]): DiagnosticsSummary {
  const bySeverity: Record<IssueSeverity, number> = { error: 0, warning: 0, info: 0 };
  const byRule: Record<string, number> = {};
  for (const issue of issues) {
    bySeverity[issue.severity] += 1;
    byRule[issue.ruleId] = (byRule[issue.ruleId] ?? 0) + 1;
  }
  return { totalIssues: issues.length, bySeverity, byRule };
}

/** Phân tích nhiều file cùng lúc — dùng cho ZIP project analysis. */
export function analyzeFiles(files: Array<{ path: string; content: string }>): DiagnosticIssue[] {
  return files.flatMap((f) => analyzeFile(f.path, f.content));
}
