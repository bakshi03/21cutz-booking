import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '21 Cutz — Резервации',
  description: 'Запазете час при нашите професионални бръснари',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  )
}
