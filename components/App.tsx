'use client';

import { useMemo, useState } from 'react';

type Msg = { role: 'user' | 'ai'; text: string };
type Panel = React.ReactNode;

const initial: Msg[] = [
  {
    role: 'ai',
    text: 'Xin chào. Tôi là VIETCODE-AI v0.3.\n\nĐây là Web Studio của một model được xây từ random weights. Giao diện không dùng AI API và hiện đang ở demo mode cho đến khi inference worker thật được nối vào.',
  },
];

function reply(input: string) {
  const q = input.toLowerCase();
  if (q.includes('debug')) {
    return 'Quy trình debug: tái hiện lỗi → đọc stack/error → cô lập nguyên nhân → sửa nhỏ nhất → chạy lại test/build. Evaluator v0.3 cũng được thiết kế theo hướng đo kết quả thay vì chỉ nhìn văn bản.';
  }
  if (q.includes('react')) {
    return 'Với React, nên tách UI thành component nhỏ, xác định props/state rõ ràng và tránh side effect không cần thiết. Khi benchmark thật được nối vào, output sẽ được test tự động.';
  }
  if (q.includes('css')) {
    return 'Ưu tiên layout bằng Grid/Flexbox, mobile-first, token hóa khoảng cách và breakpoint. Đừng phụ thuộc vào vị trí tuyệt đối cho toàn bộ giao diện.';
  }
  return 'Task đã được nhận. Demo UI chưa gọi model thật. Core Transformer, tokenizer BPE, dataset pipeline và evaluator nằm trong thư mục ai/. Đây là chủ ý để website không che giấu trạng thái thực của AI.';
}

export default function App() {
  const [section, setSection] = useState('Chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>(initial);

  const metrics = useMemo(
    () => [
      ['Core', 'Transformer'],
      ['Tokenizer', 'BPE'],
      ['Data', 'Gated'],
      ['API', 'None'],
    ],
    [],
  );

  function send() {
    const value = input.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: value },
      { role: 'ai', text: reply(value) },
    ]);
    setInput('');
  }

  const panels: Record<string, Panel> = {
    'Code Lab': (
      <>
        <div className="tabbar">
          <button className="tab on">main.tsx</button>
          <button className="tab">styles.css</button>
          <button className="tab">tests</button>
        </div>
        <div className="code">
          {'export function WebComponent() {\n'}
          {'  return <section>Hello VIETCODE</section>\n'}
          {'}\n\n'}
          {'// Run → evaluator → score → experience'}
        </div>
      </>
    ),
    Knowledge: (
      <>
        <div className="card">
          <h3>Knowledge pipeline</h3>
          <div className="code">
            document → normalize → dedupe → quality gate → candidate → validated → accepted
          </div>
        </div>
        <div className="warn">
          Knowledge mới không tự động thay đổi weights. Cần validation và benchmark trước khi promote.
        </div>
      </>
    ),
    Learning: (
      <>
        <div className="card">
          <h3>Daily learning</h3>
          <div className="row"><span>Queue</span><b className="value">READY</b></div>
          <div className="row"><span>Automatic weight update</span><b className="value">OFF</b></div>
          <div className="row"><span>Checkpoint / rollback</span><b className="value">ENABLED</b></div>
        </div>
        <div className="code">candidate → validated → train → benchmark → promote / rollback</div>
      </>
    ),
    Evaluation: (
      <>
        <div className="card">
          <h3>Coding benchmark</h3>
          {['HTML structure', 'CSS layout', 'JavaScript', 'TypeScript', 'React', 'Next.js'].map((item) => (
            <div className="row" key={item}>
              <span>{item}</span>
              <span className="value">READY</span>
            </div>
          ))}
        </div>
        <div className="empty">V0.3 dùng smoke evaluator minh bạch. V0.4 sẽ bổ sung execution/browser tests.</div>
      </>
    ),
    'Model Registry': (
      <div className="card">
        <h3>Version control</h3>
        <div className="row"><span>Active</span><span className="value">v0.3-demo</span></div>
        <div className="row"><span>Benchmark gate</span><span className="value">ON</span></div>
        <div className="row"><span>Rollback</span><span className="value">READY</span></div>
      </div>
    ),
  };

  return (
    <div className="shell">
      <div className="ambient" />
      <header className="top">
        <div className="brand">
          <div className="logo">V</div>
          VIETCODE <span className="pill">AI v0.3</span>
        </div>
        <span className="pill">FROM-ZERO • NO API</span>
      </header>

      <div className="grid">
        <aside className="side">
          <div className="group">Workspace</div>
          {['Chat', 'Code Lab', 'Knowledge', 'Learning', 'Evaluation'].map((item) => (
            <button
              className={`nav ${section === item ? 'on' : ''}`}
              onClick={() => setSection(item)}
              key={item}
            >
              {item}
            </button>
          ))}
          <div className="group">System</div>
          <button
            className={`nav ${section === 'Model Registry' ? 'on' : ''}`}
            onClick={() => setSection('Model Registry')}
          >
            Model Registry
          </button>
        </aside>

        <main className="main">
          <section className="hero">
            <h1>Web Coding AI, từ số 0.</h1>
            <p>
              Tiếng Việt-first • Code-first • kiểm định trước khi học • checkpoint + rollback.
              V0.3 tập trung làm cho vòng đời học của AI có thể đo và mở rộng.
            </p>
            <div className="metrics">
              {metrics.map(([label, value]) => (
                <div className="metric" key={label}>
                  <small>{label}</small>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </section>

          {section === 'Chat' ? (
            <section className="surface">
              <div className="head"><b>AI Chat</b><span className="pill">Demo inference</span></div>
              <div className="body">
                <div className="messages">
                  {messages.map((message, index) => (
                    <div className={`msg ${message.role}`} key={`${message.role}-${index}`}>
                      <small>{message.role === 'ai' ? 'VIETCODE-AI' : 'Bạn'}</small>
                      {message.text}
                    </div>
                  ))}
                </div>
                <div className="compose">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ví dụ: sửa lỗi React này..."
                  />
                  <button className="send" onClick={send}>Gửi</button>
                </div>
              </div>
            </section>
          ) : (
            <section className="surface">
              <div className="head"><b>{section}</b><span className="pill">v0.3</span></div>
              <div className="body">{panels[section]}</div>
            </section>
          )}
        </main>

        <aside className="right">
          <div className="card">
            <h3>System</h3>
            <div className="row"><span><i className="dot" />Web</span><span className="value">Ready</span></div>
            <div className="row"><span>AI API</span><span className="value">None</span></div>
            <div className="row"><span>Weights</span><span className="value">Random</span></div>
            <div className="row"><span>Learning gate</span><span className="value">Active</span></div>
          </div>

          <div className="card">
            <h3>Pipeline</h3>
            <div className="code">{'Raw data\n ↓\nClean + dedupe\n ↓\nTokenizer\n ↓\nTransformer\n ↓\nBenchmark\n ↓\nRegistry'}</div>
          </div>

          <div className="card">
            <h3>Resource policy</h3>
            <div className="warn">Training có giới hạn thời gian mỗi phiên và checkpoint định kỳ. Không cần treo máy 24/7.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
