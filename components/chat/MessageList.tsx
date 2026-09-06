'use client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <p style={{ color: 'var(--hpgk-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
        Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện bên dưới.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 680, margin: '0 auto 24px' }}>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.role === 'user' ? 'linear-gradient(135deg, var(--hpgk-primary), var(--hpgk-accent))' : 'var(--hpgk-surface-elevated)',
            border: m.role === 'user' ? 'none' : '1px solid var(--hpgk-border)',
            color: m.role === 'user' ? '#fff' : 'var(--hpgk-text)',
            borderRadius: 'var(--radius-m)',
            padding: '10px 14px',
            fontSize: '0.92rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {m.content}
        </div>
      ))}
    </div>
  );
}
