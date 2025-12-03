'use client'

import { useState, useEffect } from 'react'
import styles from '../relatorios.module.css'
import { DollarSignIcon, CreditCardIcon, SmartphoneIcon, DownloadIcon, TrendingUpIcon, BarChartIcon } from '@/components/icons'

interface RelatorioFinanceiro {
  totalPorPagamento: { [key: string]: number }
  taxaEstimada: number
  totalBruto: number
  totalLiquido: number
  resumoMensal: Array<{ mes: string; total: number; taxas: number; liquido: number }>
  periodo: { tipo: string; inicio: string; fim: string }
}

export default function RelatorioFinanceiroPage() {
  const [data, setData] = useState<RelatorioFinanceiro | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')

  useEffect(() => {
    fetchData()
  }, [periodo])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/relatorios/financeiro?periodo=${periodo}`)
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
    if (!data || data.totalBruto === 0) {
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
    const periodoLabel = periodo === 'dia' ? 'Dia' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mês' : 'Ano'

    // Resumo
    const resumo = [
      [`Relatório Financeiro - ${periodoLabel}`, hoje],
      ['Total Bruto', formatCurrency(data.totalBruto)],
      ['Taxa Estimada', formatCurrency(data.taxaEstimada)],
      ['Total Líquido', formatCurrency(data.totalLiquido)],
      [],
    ]

    // Total por Pagamento
    const pagamentoHeaders = ['Forma de Pagamento', 'Total']
    const pagamentoRows = Object.entries(data.totalPorPagamento).map(([metodo, total]) => [
      metodo,
      formatCurrency(total),
    ])

    // Resumo Mensal
    const mensalHeaders = ['Mês', 'Total Bruto', 'Taxas', 'Total Líquido']
    const mensalRows = data.resumoMensal.map(item => [
      item.mes,
      formatCurrency(item.total),
      formatCurrency(item.taxas),
      formatCurrency(item.liquido),
    ])

    const csvContent = [
      ...resumo.map(row => row.map(escapeCSV).join(separator)),
      'Total por Forma de Pagamento',
      pagamentoHeaders.map(escapeCSV).join(separator),
      ...pagamentoRows.map(row => row.map(escapeCSV).join(separator)),
      [],
      'Resumo por Período (Últimos 12 Meses)',
      mensalHeaders.map(escapeCSV).join(separator),
      ...mensalRows.map(row => row.map(escapeCSV).join(separator)),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_financeiro_${periodo}_${hoje}.csv`)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatório Financeiro</h1>
          <p className={styles.subtitle}>Análise financeira detalhada</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={styles.periodoSelector}>
          <button
            className={periodo === 'dia' ? styles.activeButton : styles.periodoButton}
            onClick={() => setPeriodo('dia')}
          >
            Dia
          </button>
          <button
            className={periodo === 'semana' ? styles.activeButton : styles.periodoButton}
            onClick={() => setPeriodo('semana')}
          >
            Semana
          </button>
          <button
            className={periodo === 'mes' ? styles.activeButton : styles.periodoButton}
            onClick={() => setPeriodo('mes')}
          >
            Mês
          </button>
          <button
            className={periodo === 'ano' ? styles.activeButton : styles.periodoButton}
            onClick={() => setPeriodo('ano')}
          >
            Ano
          </button>
          </div>
          <button
            className={styles.exportButton}
            onClick={handleExportCSV}
            disabled={!data || data.totalBruto === 0}
          >
            <DownloadIcon size={18} color="white" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <DollarSignIcon size={48} color="#10b981" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Total Bruto
              <TrendingUpIcon size={16} color="#10b981" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.totalBruto)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <BarChartIcon size={48} color="#dc2626" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Taxa Estimada
              <TrendingUpIcon size={16} color="#dc2626" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue} style={{ color: '#dc2626' }}>
              -{formatCurrency(data.taxaEstimada)}
            </div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <TrendingUpIcon size={48} color="#059669" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Total Líquido
              <TrendingUpIcon size={16} color="#059669" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue} style={{ color: '#059669' }}>
              {formatCurrency(data.totalLiquido)}
            </div>
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

      {/* Resumo por Período (Últimos 12 meses) */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Resumo por Período (Últimos 12 Meses)</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Total Bruto</th>
                <th>Taxas</th>
                <th>Total Líquido</th>
              </tr>
            </thead>
            <tbody>
              {data.resumoMensal.map((item, index) => (
                <tr key={index}>
                  <td>{item.mes}</td>
                  <td className={styles.numberCell}>{formatCurrency(item.total)}</td>
                  <td className={styles.numberCell} style={{ color: '#dc2626' }}>
                    -{formatCurrency(item.taxas)}
                  </td>
                  <td className={styles.numberCell} style={{ color: '#059669', fontWeight: 600 }}>
                    {formatCurrency(item.liquido)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

