'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface MenuItem {
  href: string
  icon: string
  label: string
  description: string
}

const menuItems: MenuItem[] = [
  {
    href: '/',
    icon: '📊',
    label: 'Dashboard',
    description: 'Visão geral',
  },
  {
    href: '/produtos',
    icon: '📦',
    label: 'Cadastro de Produtos',
    description: 'Gestão de produtos',
  },
  {
    href: '/pdv',
    icon: '🛒',
    label: 'PDV - Vendas',
    description: 'Ponto de venda',
  },
  {
    href: '/vendas',
    icon: '🕐',
    label: 'Histórico de Vendas',
    description: 'Vendas realizadas',
  },
  {
    href: '/estoque',
    icon: '📋',
    label: 'Estoque',
    description: 'Controle de estoque',
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>S</div>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>ERP Têxtil</div>
          <div className={styles.logoSubtitle}>ERP Sistema</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
            >
              <div className={styles.menuIcon}>{item.icon}</div>
              <div className={styles.menuContent}>
                <div className={styles.menuLabel}>{item.label}</div>
                <div className={styles.menuDescription}>{item.description}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className={styles.userAvatar}>
        <div className={styles.avatarCircle}>U</div>
      </div>
    </aside>
  )
}

