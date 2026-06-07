import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AEP Instruire Online',
    template: '%s | AEP Instruire Online',
  },
  description: 'Platforma oficială de instruire electorală – IDEE_ROAEP',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
