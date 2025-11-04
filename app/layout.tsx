import type { Metadata } from 'next'
import Layout from '@/components/Layout'
import './globals.css'

export const metadata: Metadata = {
  title: 'ERP Têxtil',
  description: 'Sistema de Gestão Empresarial para Indústria Têxtil',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}

