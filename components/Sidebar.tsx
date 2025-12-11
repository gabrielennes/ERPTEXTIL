'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, ReactNode } from 'react'
import {
  BoxIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  ClockIcon,
  ClipboardIcon,
  BarChartIcon,
  ReportIcon,
  CalendarIcon,
  PieChartIcon,
  FileTextIcon,
  UserIcon,
  TruckIcon,
  CreditCardIcon,
} from '@/components/icons'
import { CompanyLogo } from '@/components/Logo'
import { useTheme } from './ThemeContext'
import styles from './Sidebar.module.css'

interface SubMenuItem {
  href: string
  icon: ReactNode
  label: string
  description: string
}

interface MenuItem {
  href?: string
  icon: ReactNode
  label: string
  description: string
  subItems?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  {
    href: '/',
    icon: <BarChartIcon size={24} />,
    label: 'Dashboard',
    description: 'Visão geral',
  },
  {
    icon: <BoxIcon size={24} />,
    label: 'Produtos',
    description: 'Gestão de produtos',
    subItems: [
      {
        href: '/produtos',
        icon: <BoxIcon size={20} />,
        label: 'Cadastro de Produtos',
        description: 'Gestão de produtos',
      },
      {
        href: '/estoque',
        icon: <ClipboardIcon size={20} />,
        label: 'Estoque',
        description: 'Controle de estoque',
      },
    ],
  },
  {
    icon: <DollarSignIcon size={24} />,
    label: 'Vendas',
    description: 'Gestão de vendas',
    subItems: [
      {
        href: '/pdv',
        icon: <ShoppingCartIcon size={20} />,
        label: 'PDV - Vendas',
        description: 'Ponto de venda',
      },
      {
        href: '/vendas',
        icon: <ClockIcon size={20} />,
        label: 'Histórico de Vendas',
        description: 'Vendas realizadas',
      },
    ],
  },
  {
    icon: <ReportIcon size={24} />,
    label: 'Gestão Empresarial',
    description: 'Relatórios e análises',
    subItems: [
      {
        href: '/relatorios/diario',
        icon: <CalendarIcon size={20} />,
        label: 'Relatório Diário',
        description: 'Análise do dia',
      },
      {
        href: '/relatorios/semanal',
        icon: <BarChartIcon size={20} />,
        label: 'Relatório Semanal',
        description: 'Análise da semana',
      },
      {
        href: '/relatorios/mensal',
        icon: <TrendingUpIcon size={20} />,
        label: 'Relatório Mensal',
        description: 'Análise do mês',
      },
      {
        href: '/relatorios/financeiro',
        icon: <PieChartIcon size={20} />,
        label: 'Relatório Financeiro',
        description: 'Análise financeira',
      },
    ],
  },
  {
    icon: <FileTextIcon size={24} />,
    label: 'Cadastro',
    description: 'Cadastros gerais',
    subItems: [
      {
        href: '/cadastro/cliente',
        icon: <UserIcon size={20} />,
        label: 'Cadastro de Cliente',
        description: 'Gerenciar clientes',
      },
      {
        href: '/cadastro/fornecedor',
        icon: <TruckIcon size={20} />,
        label: 'Cadastro de Fornecedor',
        description: 'Gerenciar fornecedores',
      },
    ],
  },
  {
    icon: <CreditCardIcon size={24} />,
    label: 'Financeiro',
    description: 'Gestão financeira',
    subItems: [
      {
        href: '/financeiro/contas-a-pagar',
        icon: <DollarSignIcon size={20} />,
        label: 'Contas a Pagar',
        description: 'Gerenciar contas a pagar',
      },
      {
        href: '/financeiro/contas-a-receber',
        icon: <TrendingUpIcon size={20} />,
        label: 'Contas a Receber',
        description: 'Gerenciar contas a receber',
      },
      {
        href: '/financeiro/extrato-movimentacao',
        icon: <FileTextIcon size={20} />,
        label: 'Extrato de Movimentação Financeira',
        description: 'Extrato de pagamentos e recebimentos',
      },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
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
        <CompanyLogo size={60} className={styles.logoIcon} />
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>EDS</div>
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
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {theme === 'light' ? (
              <svg
                className={styles.themeToggleIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                className={styles.themeToggleIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
            <span className={styles.actionText}>
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className={styles.actionButton}
            title="Sair do sistema"
          >
            <svg
              className={styles.actionIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className={styles.actionText}>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

