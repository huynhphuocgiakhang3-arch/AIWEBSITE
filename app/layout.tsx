import './globals.css'

export const metadata = {
  title: 'HPGK AGENT — Vietnamese Code Intelligence',
  description: 'A from-zero Vietnamese-first coding AI research workspace.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>
}
