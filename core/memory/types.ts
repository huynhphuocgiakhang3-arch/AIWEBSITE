/**
 * core/memory/types.ts
 *
 * Theo mục 14 spec gốc: memory phải tách theo loại, không lưu mọi thứ.
 */

export type MemoryType =
  | 'conversation'
  | 'project'
  | 'user_preference'
  | 'technical_decision'
  | 'bug'
  | 'knowledge_usage';

export type MemoryScope =
  | { kind: 'global' }
  | { kind: 'project'; projectId: string }
  | { kind: 'conversation'; conversationId: string };

export interface MemoryRecord {
  id: string;
  type: MemoryType;
  content: string;
  scope: MemoryScope;
  /** 0-100, do logic nghiệp vụ gán khi tạo (ví dụ quyết định kỹ thuật quan trọng > log gỡ lỗi vụn vặt) */
  importance: number;
  /** 0-100, mức độ chắc chắn nội dung này còn đúng/còn liên quan */
  confidence: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
  source: string;
}
