'use client'

import { useState, useEffect } from 'react'
import MetricCard from '@/components/MetricCard'
import ActionCard from '@/components/ActionCard'
import {
  BoxIcon,
  LayersIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  ClockIcon,
} from '@/components/icons'
import { CompanyLogo } from '@/components/Logo'
import styles from './dashboard.module.css'
import SalesChart from '@/components/SalesChart'
import TicketMedioChart from '@/components/TicketMedioChart'
import LowStockList from '@/components/LowStockList'
import RecentSalesTable from '@/components/RecentSalesTable'

interface DashboardData {
  kpis: {
    totalProdutos: number
    totalVariacoes: number
    vendasHoje: number
    totalVendas: number
    quantidadeVendas: number
    ticketMedio: number
  }
  vendasPorDia: { [key: number]: number }
  produtosEstoqueBaixo: Array<{
    id: string
    sku: string
    produtoNome: string
    estoque: number
    tamanho: string | null
    cor: string | null
  }>
  ultimasVendas: Array<{
    id: string
    numero?: string | null
    total: number
    parcelas?: number
    data: string
    produtos: Array<{
      nome: string
      quantidade: number
      precoUnitario: number
    }>
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.welcomeBanner}>
          <CompanyLogo size={120} className={styles.welcomeLogo} />
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Enterprise Dev Solutions</h1>
            <p className={styles.welcomeSubtitle}>
              Sistema de gestão
            </p>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Indicadores Chaves</h2>

      <div className={styles.metricsGrid}>
        <MetricCard
          title="Total de Produtos"
          value={data?.kpis.totalProdutos.toString() || '0'}
          icon={<BoxIcon size={24} />}
          iconColor="#3b82f6"
        />
        <MetricCard
          title="Variações Cadastradas"
          value={data?.kpis.totalVariacoes.toString() || '0'}
          icon={<LayersIcon size={24} />}
          iconColor="#3b82f6"
        />
        <MetricCard
          title="Vendas Hoje"
          value={formatCurrency(data?.kpis.vendasHoje || 0)}
          icon={<TrendingUpIcon size={24} />}
          iconColor="#10b981"
        />
        <MetricCard
          title="Total de Vendas"
          value={formatCurrency(data?.kpis.totalVendas || 0)}
          icon={<DollarSignIcon size={24} />}
          iconColor="#10b981"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(data?.kpis.ticketMedio || 0)}
          icon={<DollarSignIcon size={24} />}
          iconColor="#8b5cf6"
        />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Vendas do Mês</h3>
          <SalesChart data={data?.vendasPorDia || {}} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Ticket Médio</h3>
          <TicketMedioChart
            ticketMedio={data?.kpis.ticketMedio || 0}
            totalVendas={data?.kpis.totalVendas || 0}
            quantidadeVendas={data?.kpis.quantidadeVendas || 0}
          />
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.contentCard}>
          <h3 className={styles.chartTitle}>Produtos com Estoque Baixo</h3>
          <LowStockList produtos={data?.produtosEstoqueBaixo || []} />
        </div>
        <div className={styles.contentCard}>
          <h3 className={styles.chartTitle}>Últimas Vendas</h3>
          <RecentSalesTable vendas={data?.ultimasVendas || []} />
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
      <div className={styles.actionsGrid}>
        <ActionCard
          href="/produtos"
          icon={<BoxIcon size={48} />}
          title="Cadastro de Produtos"
          description="Gerenciar produtos e variações"
          iconColor="#1e40af"
        />
        <ActionCard
          href="/pdv"
          icon={<ShoppingCartIcon size={48} />}
          title="PDV - Vendas"
          description="Realizar vendas"
          iconColor="#059669"
        />
        <ActionCard
          href="/vendas"
          icon={<ClockIcon size={48} />}
          title="Histórico de Vendas"
          description="Consultar vendas realizadas"
          iconColor="#7c3aed"
        />
      </div>
    </div>
  )
}
