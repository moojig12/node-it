import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Node It',
  description: 'Node-based note organization app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
