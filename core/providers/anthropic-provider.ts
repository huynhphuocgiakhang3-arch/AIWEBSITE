import type { AIProvider, AICompletionRequest, AICompletionResult } from './types.ts';

/**
 * Provider thật gọi Anthropic API (/v1/messages). Dùng global fetch của
 * Node.js 18+ — KHÔNG cần thêm dependency ngoài. Chưa được test end-to-end
 * trong sandbox này vì không có network access; logic map request/response
 * đã được viết đúng theo format API chính thức của Anthropic.
 *
 * Kiến trúc cho phép thêm provider khác (OpenAI-compatible, Google-compatible,
 * custom) bằng cách implement cùng interface AIProvider — xem core/providers/types.ts.
 */
export function createAnthropicProvider(config: { apiKey: string; model?: string }): AIProvider {
  const model = config.model ?? 'claude-sonnet-4-6';

  return {
    id: 'anthropic',
    isConfigured: () => Boolean(config.apiKey && config.apiKey.length > 0),

    async complete(request: AICompletionRequest): Promise<AICompletionResult> {
      if (!config.apiKey) {
        return { ok: false, errorCode: 'not_configured', message: 'Thiếu ANTHROPIC_API_KEY.' };
      }

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: request.maxTokens ?? 1024,
            messages: request.messages
              .filter((m) => m.role !== 'system')
              .map((m) => ({ role: m.role, content: m.content })),
            system: request.messages.find((m) => m.role === 'system')?.content,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          return {
            ok: false,
            errorCode: 'provider_error',
            message: `Anthropic API trả về lỗi ${response.status}: ${text.slice(0, 300)}`,
          };
        }

        const data = (await response.json()) as {
          content?: Array<{ type: string; text?: string }>;
        };

        const text = (data.content ?? [])
          .filter((block) => block.type === 'text' && typeof block.text === 'string')
          .map((block) => block.text)
          .join('\n');

        if (!text) {
          return { ok: false, errorCode: 'provider_error', message: 'Anthropic API không trả về nội dung text nào.' };
        }

        return { ok: true, content: text, model };
      } catch (err) {
        return {
          ok: false,
          errorCode: 'provider_error',
          message: `Lỗi khi gọi Anthropic API: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
