import type { AIProvider, AICompletionResult } from './types.ts';

/**
 * Provider mặc định khi chưa có API key nào được cấu hình.
 * KHÔNG BAO GIỜ trả về nội dung giả lập như thể đó là câu trả lời AI thật.
 */
export const notConfiguredProvider: AIProvider = {
  id: 'not-configured',
  isConfigured: () => false,
  async complete(): Promise<AICompletionResult> {
    return {
      ok: false,
      errorCode: 'not_configured',
      message: 'AI provider not configured. Thêm ANTHROPIC_API_KEY (hoặc provider khác) vào .env để bắt đầu trò chuyện thật.',
    };
  },
};
