import "./globals.css"; import type {Metadata} from "next";
export const metadata:Metadata={title:"HPGK — Intelligence Engine",description:"Premium AI engineering workspace"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}