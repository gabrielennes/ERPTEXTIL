'use client'

import Sidebar from './Sidebar'
import styles from './Layout.module.css'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  // Na página de login, não mostrar Sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  )
}

