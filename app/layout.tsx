import type { Metadata } from 'next'
import Layout from '@/components/Layout'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Enterprise Dev Solutions - ERP',
  description: 'Sistema de Gestão Empresarial para Indústria Têxtil',
  icons: {
    icon: '/images/EDSERP.jpg',
    shortcut: '/images/EDSERP.jpg',
    apple: '/images/EDSERP.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}

