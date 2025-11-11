'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from './Sidebar.module.css'

interface SubMenuItem {
  href: string
  icon: string
  label: string
  description: string
}

interface MenuItem {
  href?: string
  icon: string
  label: string
  description: string
  subItems?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  {
    href: '/',
    icon: '📊',
    label: 'Dashboard',
    description: 'Visão geral',
  },
  {
    icon: '📦',
    label: 'Produtos',
    description: 'Gestão de produtos',
    subItems: [
      {
        href: '/produtos',
        icon: '📦',
        label: 'Cadastro de Produtos',
        description: 'Gestão de produtos',
      },
      {
        href: '/estoque',
        icon: '📋',
        label: 'Estoque',
        description: 'Controle de estoque',
      },
    ],
  },
  {
    icon: '💰',
    label: 'Vendas',
    description: 'Gestão de vendas',
    subItems: [
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
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<{ email: string; name: string | null; role: string }>({
    email: '',
    name: null,
    role: 'user',
  })
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Buscar informações do usuário da sessão via API
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await res.json()
          setUserInfo({
            email: data.email || 'Usuário',
            name: data.name || null,
            role: data.role || 'user',
          })
        }
      } catch (e) {
        // Ignorar erro
      }
    }
    fetchUserInfo()

    // Expandir automaticamente o menu se algum subitem estiver ativo
    const menusToExpand = new Set<string>()
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((subItem) => pathname === subItem.href)
        if (hasActiveSubItem) {
          menusToExpand.add(item.label)
        }
      }
    })
    if (menusToExpand.size > 0) {
      setExpandedMenus(menusToExpand)
    }
  }, [pathname])

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(label)) {
        newSet.delete(label)
      } else {
        newSet.add(label)
      }
      return newSet
    })
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      router.push('/login')
    }
  }

  const isSubItemActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false
    return subItems.some((subItem) => pathname === subItem.href)
  }

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
          if (item.subItems) {
            const isExpanded = expandedMenus.has(item.label)
            const hasActiveSubItem = isSubItemActive(item.subItems)

            return (
              <div key={item.label} className={styles.menuGroup}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`${styles.menuItem} ${styles.menuItemWithSubs} ${
                    hasActiveSubItem ? styles.active : ''
                  }`}
                >
                  <div className={styles.menuIcon}>{item.icon}</div>
                  <div className={styles.menuContent}>
                    <div className={styles.menuLabel}>{item.label}</div>
                    <div className={styles.menuDescription}>{item.description}</div>
                  </div>
                  <div className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
                    ▶
                  </div>
                </button>
                {isExpanded && (
                  <div className={styles.subMenu}>
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`${styles.subMenuItem} ${isSubActive ? styles.subActive : ''}`}
                        >
                          <div className={styles.subMenuIcon}>{subItem.icon}</div>
                          <div className={styles.subMenuContent}>
                            <div className={styles.subMenuLabel}>{subItem.label}</div>
                            <div className={styles.subMenuDescription}>{subItem.description}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href!}
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

      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.avatarCircle}>
            {(userInfo.name || userInfo.email)?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{userInfo.name || userInfo.email || 'Usuário'}</div>
            <div className={styles.userRole}>
              {userInfo.role === 'admin' ? 'Administrador' : 'Usuário'}
            </div>
          </div>
        </div>
        <div className={styles.userActions}>
          <button
            onClick={handleLogout}
            className={styles.actionButton}
            title="Sair do sistema"
          >
            <span className={styles.actionIcon}>🚪</span>
            <span className={styles.actionText}>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

