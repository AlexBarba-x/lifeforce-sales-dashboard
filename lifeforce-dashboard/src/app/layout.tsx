import type { Metadata } from 'next'
import './globals.css'

// Fonts loaded via @font-face in globals.css (Canela + Söhne — Takashi brand kit)
// Do NOT use Google Fonts — Canela and Söhne are commercial typefaces served from /public/fonts/

export const metadata: Metadata = {
  title: 'Lifeforce Financial — Dashboard',
  description: 'Life settlement case management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
