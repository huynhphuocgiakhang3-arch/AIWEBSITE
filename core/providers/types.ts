/**
 * core/providers/types.ts
 *
 * Theo mục 39-40 spec gốc: "Knowledge ≠ Model", provider là lớp riêng,
 * và khi chưa cấu hình provider, UI PHẢI hiển thị rõ "AI provider not
 * configured" — KHÔNG được tạo câu trả lời giả rồi gọi đó là AI.
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  maxTokens?: number;
}

export type AICompletionResult =
  | { ok: true; content: string; model: string }
  | { ok: false; errorCode: 'not_configured' | 'provider_error'; message: string };

export interface AIProvider {
  id: string;
  isConfigured: () => boolean;
  complete: (request: AICompletionRequest) => Promise<AICompletionResult>;
}
