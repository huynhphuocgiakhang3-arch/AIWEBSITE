/**
 * core/knowledge/types.ts
 *
 * Kiểu dữ liệu cho một mục tri thức trong HPGK Knowledge Core.
 * Mỗi entry PHẢI có chiều sâu thực sự: why/how/khi nào dùng/khi nào không,
 * lỗi thường gặp, cách debug, đánh đổi... KHÔNG chấp nhận kiểu định nghĩa
 * một dòng như Wikipedia rút gọn.
 */

export type KnowledgeDomain =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'javascript'
  | 'typescript'
  | 'react'
  | 'nextjs'
  | 'security'
  | 'performance'
  | 'ai-engineering'
  | 'devops'
  | 'architecture'
  | 'accessibility'
  | 'testing';

export interface KnowledgeExample {
  /** Mô tả ngắn ví dụ này minh hoạ điều gì */
  description: string;
  /** Đoạn code hoặc mô tả tình huống thực tế */
  code?: string;
}

export interface KnowledgeEntry {
  id: string;
  domain: KnowledgeDomain;
  title: string;
  /** Khái niệm là gì — định nghĩa chính xác, không rút gọn quá mức */
  concept: string;
  /** Tại sao khái niệm này tồn tại / tại sao nó quan trọng */
  why: string;
  /** Cách áp dụng trong thực tế, từng bước hoặc nguyên lý vận hành */
  how: string;
  when_to_use: string[];
  when_not_to_use: string[];
  prerequisites: string[];
  best_practices: string[];
  patterns: string[];
  anti_patterns: string[];
  common_mistakes: string[];
  failure_modes: string[];
  debugging: string[];
  security: string[];
  performance: string[];
  accessibility: string[];
  examples: KnowledgeExample[];
  tradeoffs: string[];
  /** id của các entry liên quan trong cùng knowledge base */
  related: string[];
  /**
   * Mức độ tin cậy CHỦ QUAN do người biên soạn gán khi tạo entry (0-100).
   * Đây KHÔNG phải số liệu đo lường tự động — không dùng con số này
   * như một chỉ số "độ chính xác AI" trong UI.
   */
  confidence: number;
  /** Nguồn gốc thông tin: 'curated' (biên soạn thủ công), 'reviewed', v.v. */
  provenance: string[];
  version: string;
}
