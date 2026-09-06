import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'HPGK Agent',
  description: 'Trí tuệ đồng hành cùng bạn xây dựng.',
};

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: '🏠' },
  { href: '/projects', label: 'Dự án', icon: '📁' },
  { href: '/files', label: 'Tệp tin', icon: '🗂️' },
  { href: '/knowledge', label: 'Cơ sở tri thức', icon: '🧠' },
  { href: '/settings', label: 'Cài đặt', icon: '⚙️' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <span aria-hidden>◆</span> HPGK <span style={{ color: 'var(--hpgk-muted)', fontWeight: 400 }}>AGENT</span>
            </div>
            <ProviderStatusPill />
          </header>

          <div className="shell">
            <nav className="sidebar" aria-label="Điều hướng chính">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="nav-item">
                  <span aria-hidden>{item.icon}</span> {item.label}
                </Link>
              ))}
            </nav>

            <main className="main">{children}</main>
          </div>

          <nav className="mobile-nav" aria-label="Điều hướng di động">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </body>
    </html>
  );
}

/**
 * Server component nhỏ hiển thị trạng thái AI provider THẬT — đọc trực
 * tiếp process.env, không giả lập trạng thái "đã kết nối".
 */
function ProviderStatusPill() {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  return (
    <span className="status-pill">
      <span className={`status-dot ${configured ? 'ok' : 'warn'}`} />
      {configured ? 'AI đã kết nối' : 'Chưa cấu hình AI'}
    </span>
  );
}
