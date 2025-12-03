'use client'

import { useState, useEffect } from 'react'
import styles from '../relatorios.module.css'
import { DollarSignIcon, CreditCardIcon, SmartphoneIcon, DownloadIcon, TrendingUpIcon, ShoppingCartIcon, BarChartIcon, BoxIcon } from '@/components/icons'

interface RelatorioDiario {
  totalVendido: number
  totalItens: number
  ticketMedio: number
  produtoMaisVendido: { nome: string; quantidade: number; total: number } | null
  top10Produtos: Array<{ nome: string; quantidade: number; total: number }>
  vendasPorHora: { [key: number]: number }
  totalPorPagamento: { [key: string]: number }
  totalVendas: number
}

export default function RelatorioDiarioPage() {
  const [data, setData] = useState<RelatorioDiario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/relatorios/diario')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleExportCSV = () => {
    if (!data || data.totalVendas === 0) {
      alert('Não há dados para exportar')
      return
    }

    const escapeCSV = (value: string | number): string => {
      const str = String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const separator = ';'
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')

    // Resumo
    const resumo = [
      ['Relatório Diário', hoje],
      ['Total Vendido', formatCurrency(data.totalVendido)],
      ['Total de Itens', data.totalItens],
      ['Ticket Médio', formatCurrency(data.ticketMedio)],
      ['Total de Vendas', data.totalVendas],
      [],
    ]

    // Top 10 Produtos
    const produtosHeaders = ['Posição', 'Produto', 'Quantidade', 'Total']
    const produtosRows = data.top10Produtos.map((produto, index) => [
      index + 1,
      produto.nome,
      produto.quantidade,
      formatCurrency(produto.total),
    ])

    // Vendas por Hora
    const horasHeaders = ['Hora', 'Total Vendido']
    const horasRows = Array.from({ length: 24 }, (_, i) => [
      `${String(i).padStart(2, '0')}h`,
      formatCurrency(data.vendasPorHora[i] || 0),
    ])

    // Total por Pagamento
    const pagamentoHeaders = ['Forma de Pagamento', 'Total']
    const pagamentoRows = Object.entries(data.totalPorPagamento).map(([metodo, total]) => [
      metodo,
      formatCurrency(total),
    ])

    const csvContent = [
      ...resumo.map(row => row.map(escapeCSV).join(separator)),
      'Top 10 Produtos Mais Vendidos',
      produtosHeaders.map(escapeCSV).join(separator),
      ...produtosRows.map(row => row.map(escapeCSV).join(separator)),
      [],
      'Vendas por Hora',
      horasHeaders.map(escapeCSV).join(separator),
      ...horasRows.map(row => row.map(escapeCSV).join(separator)),
      [],
      'Total por Forma de Pagamento',
      pagamentoHeaders.map(escapeCSV).join(separator),
      ...pagamentoRows.map(row => row.map(escapeCSV).join(separator)),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_diario_${hoje}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(url)
    }, 100)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erro ao carregar dados</div>
      </div>
    )
  }

  // Preparar dados do gráfico
  const horas = Array.from({ length: 24 }, (_, i) => i)
  const maxVendas = Math.max(...Object.values(data.vendasPorHora), 1)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatório Diário</h1>
          <p className={styles.subtitle}>Análise de vendas do dia</p>
        </div>
        <button
          className={styles.exportButton}
          onClick={handleExportCSV}
          disabled={!data || data.totalVendas === 0}
        >
          <DownloadIcon size={18} color="white" />
          Exportar CSV
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <DollarSignIcon size={48} color="#10b981" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Total Vendido
              <TrendingUpIcon size={16} color="#10b981" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.totalVendido)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <BoxIcon size={48} color="#3b82f6" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Total de Itens
              <TrendingUpIcon size={16} color="#3b82f6" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{data.totalItens}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <BarChartIcon size={48} color="#8b5cf6" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Ticket Médio
              <TrendingUpIcon size={16} color="#8b5cf6" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.ticketMedio)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <ShoppingCartIcon size={48} color="#f59e0b" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Total de Vendas
              <TrendingUpIcon size={16} color="#f59e0b" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{data.totalVendas}</div>
          </div>
        </div>
      </div>

      {/* Top 10 Produtos Mais Vendidos */}
      {data.top10Produtos && data.top10Produtos.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top 10 Produtos Mais Vendidos</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.top10Produtos.map((produto, index) => (
                  <tr key={index}>
                    <td className={styles.positionCell}>#{index + 1}</td>
                    <td className={styles.produtoCell}>{produto.nome}</td>
                    <td className={styles.numberCell}>{produto.quantidade}</td>
                    <td className={styles.numberCell}>{formatCurrency(produto.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico de Vendas por Hora */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Vendas por Hora do Dia</h2>
        <div className={styles.chartContainer}>
          <div className={styles.barChart}>
            {horas.map((hora) => {
              const valor = data.vendasPorHora[hora] || 0
              const altura = maxVendas > 0 ? (valor / maxVendas) * 100 : 0
              return (
                <div key={hora} className={styles.barGroup}>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.bar}
                      style={{ height: `${altura}%` }}
                      title={formatCurrency(valor)}
                    />
                  </div>
                  <div className={styles.barLabel}>{String(hora).padStart(2, '0')}h</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Total por Forma de Pagamento */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Total por Forma de Pagamento</h2>
        <div className={styles.pagamentoGrid}>
          {Object.entries(data.totalPorPagamento).map(([metodo, total]) => (
            <div key={metodo} className={styles.pagamentoItem}>
              <div className={styles.pagamentoMetodo}>
                {metodo === 'dinheiro' && <DollarSignIcon size={18} color="#374151" />}
                {metodo === 'cartao' && <CreditCardIcon size={18} color="#374151" />}
                {metodo === 'pix' && <SmartphoneIcon size={18} color="#374151" />}
                <span style={{ textTransform: 'capitalize', marginLeft: '8px' }}>{metodo}</span>
              </div>
              <div className={styles.pagamentoTotal}>{formatCurrency(total)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

