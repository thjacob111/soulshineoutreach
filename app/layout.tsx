import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Soul Shine',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
