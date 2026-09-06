'use client';

import { useState, useRef } from 'react';

export interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled }: ComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  return (
    <div
      style={{
        background: 'var(--hpgk-surface-elevated)',
        border: '1px solid var(--hpgk-border)',
        borderRadius: 'var(--radius-l)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder="Hỏi HPGK bất cứ điều gì…"
        aria-label="Ô nhập lệnh"
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--hpgk-text)',
          resize: 'none',
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          lineHeight: 1.5,
          minHeight: 26,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Gửi"
          style={{
            marginLeft: 'auto',
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled || !value.trim() ? 0.5 : 1,
            background: 'linear-gradient(135deg, var(--hpgk-primary), var(--hpgk-accent))',
            color: '#fff',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
