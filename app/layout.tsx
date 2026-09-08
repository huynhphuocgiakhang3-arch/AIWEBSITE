import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'Forensic Deploy — Vercel Debugger',description:'Phân tích project, build log và theo dõi deployment Vercel theo thời gian thực.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
