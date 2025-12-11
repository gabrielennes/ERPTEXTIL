'use client'

import { useState, useEffect } from 'react'
import styles from '../relatorios.module.css'
import { DownloadIcon, DollarSignIcon, TrendingUpIcon, BarChartIcon } from '@/components/icons'

interface RelatorioSemanal {
  totalFaturado: number
  totalSemanaAnterior: number
  diferenca: number
  percentualVariacao: number
  rankingSKUs: Array<{ sku: string; nome: string; quantidade: number; total: number }>
  ultimos7Dias: Array<{ data: string; faturamento: number }>
  periodo: { inicio: string; fim: string }
}

export default function RelatorioSemanalPage() {
  const [data, setData] = useState<RelatorioSemanal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/relatorios/semanal')
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
    if (!data || data.rankingSKUs.length === 0) {
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
    const isPositive = data.diferenca >= 0

    // Resumo
    const resumo = [
      ['Relatório Semanal', hoje],
      ['Total Faturado', formatCurrency(data.totalFaturado)],
      ['Semana Anterior', formatCurrency(data.totalSemanaAnterior)],
      ['Variação', `${isPositive ? '+' : ''}${formatCurrency(data.diferenca)}`],
      ['Variação %', `${isPositive ? '+' : ''}${data.percentualVariacao.toFixed(2)}%`],
      [],
    ]

    // Top 10 SKUs
    const skusHeaders = ['Posição', 'SKU', 'Produto', 'Quantidade', 'Total']
    const skusRows = data.rankingSKUs.map((item, index) => [
      index + 1,
      item.sku,
      item.nome,
      item.quantidade,
      formatCurrency(item.total),
    ])

    const csvContent = [
      ...resumo.map(row => row.map(escapeCSV).join(separator)),
      'Top 10 SKUs Mais Vendidos',
      skusHeaders.map(escapeCSV).join(separator),
      ...skusRows.map(row => row.map(escapeCSV).join(separator)),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_semanal_${hoje}.csv`)
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

  const isPositive = data.diferenca >= 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatório Semanal</h1>
          <p className={styles.subtitle}>Análise de vendas da semana</p>
        </div>
        <button
          className={styles.exportButton}
          onClick={handleExportCSV}
          disabled={!data || data.rankingSKUs.length === 0}
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
              Total Faturado
              <TrendingUpIcon size={16} color="#10b981" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.totalFaturado)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <BarChartIcon size={48} color="#6b7280" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Semana Anterior
              <TrendingUpIcon size={16} color="#6b7280" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.totalSemanaAnterior)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <TrendingUpIcon size={48} color={isPositive ? '#059669' : '#dc2626'} className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Variação
              <TrendingUpIcon size={16} color={isPositive ? '#059669' : '#dc2626'} className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue} style={{ color: isPositive ? '#059669' : '#dc2626' }}>
              {isPositive ? '+' : ''}{formatCurrency(data.diferenca)}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: isPositive ? '#059669' : '#dc2626', 
              marginTop: '6px',
              fontWeight: 600,
            }}>
              {isPositive ? '+' : ''}{data.percentualVariacao.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras - Últimos 7 dias */}
      {data.ultimos7Dias && data.ultimos7Dias.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Faturamento dos Últimos 7 Dias</h2>
          <div className={styles.chartContainer}>
            <div className={styles.barChart}>
              {data.ultimos7Dias.map((dia, index) => {
                const maxFaturamento = Math.max(...data.ultimos7Dias.map(d => d.faturamento), 1)
                const alturaPercentual = maxFaturamento > 0 ? (dia.faturamento / maxFaturamento) * 100 : 0
                
                const dataObj = new Date(dia.data)
                const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })
                const diaMes = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                
                return (
                  <div key={index} className={styles.barGroup}>
                    <div className={styles.barWrapper}>
                      <div
                        className={styles.bar}
                        style={{
                          height: `${alturaPercentual}%`,
                          minHeight: dia.faturamento > 0 ? '4px' : '0',
                        }}
                        title={formatCurrency(dia.faturamento)}
                      />
                    </div>
                    <div className={styles.barLabel}>
                      <div className={styles.barLabelDay}>{diaSemana}</div>
                      <div className={styles.barLabelDate}>{diaMes}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ranking dos 10 SKUs mais vendidos */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Top 10 SKUs Mais Vendidos</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Posição</th>
                <th>SKU</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.rankingSKUs.map((item, index) => (
                <tr key={item.sku}>
                  <td className={styles.positionCell}>#{index + 1}</td>
                  <td className={styles.skuCell}>{item.sku}</td>
                  <td>{item.nome}</td>
                  <td className={styles.numberCell}>{item.quantidade}</td>
                  <td className={styles.numberCell}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

