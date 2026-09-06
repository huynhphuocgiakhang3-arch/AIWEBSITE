'use client';

import { useState } from 'react';
import { Composer } from '@/components/chat/Composer';
import { MessageList, type ChatMessage } from '@/components/chat/MessageList';

const QUICK_ACTIONS = ['Xây dựng', 'Phân tích', 'Gỡ lỗi', 'Thiết kế', 'Tối ưu'];

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  async function handleSend(text: string) {
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversationId, messages: nextMessages }),
      });
      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);

      // API trả về rõ ràng khi provider chưa cấu hình — hiển thị đúng như vậy,
      // KHÔNG hiển thị như thể đó là một câu trả lời AI bình thường.
      setMessages([...nextMessages, { role: 'assistant', content: data.content ?? data.error ?? 'Lỗi không xác định.' }]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: `Lỗi kết nối tới server: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-scroll">
      <div style={{ maxWidth: 640, margin: '0 auto 28px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.7rem', margin: '0 0 6px', fontWeight: 600 }}>Chào bạn 👋</h1>
        <p style={{ color: 'var(--hpgk-muted)', margin: 0, fontSize: '0.92rem' }}>
          Bắt đầu một cuộc trò chuyện hoặc chọn một thao tác nhanh bên dưới.
        </p>
      </div>

      <MessageList messages={messages} />

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Composer onSend={handleSend} disabled={loading} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleSend(action)}
              style={{
                padding: '7px 13px',
                borderRadius: 999,
                background: 'var(--hpgk-surface-elevated)',
                border: '1px solid var(--hpgk-border)',
                color: 'var(--hpgk-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
