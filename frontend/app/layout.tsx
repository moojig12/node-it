import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Node Notes',
  description: 'A simplistic node-based noting app for businesses and developers'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
