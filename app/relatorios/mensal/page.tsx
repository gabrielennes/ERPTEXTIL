'use client'

import { useState, useEffect } from 'react'
import styles from '../relatorios.module.css'
import { DownloadIcon, DollarSignIcon, ShoppingCartIcon, TrendingUpIcon, BarChartIcon } from '@/components/icons'

interface RelatorioMensal {
  faturamento: number
  faturamentoMesAnterior: number
  diferenca: number
  percentualVariacao: number
  totalVendas: number
  produtosMaisVendidos: Array<{ nome: string; quantidade: number; total: number }>
  curvaABC: {
    produtos: Array<{
      nome: string
      quantidade: number
      total: number
      percentual: number
      percentualAcumulado: number
      classificacao: string
    }>
    resumo: {
      classeA: { quantidade: number; percentual: number; faturamento: number }
      classeB: { quantidade: number; percentual: number; faturamento: number }
      classeC: { quantidade: number; percentual: number; faturamento: number }
    }
  }
  periodo: { inicio: string; fim: string }
}

export default function RelatorioMensalPage() {
  const [data, setData] = useState<RelatorioMensal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/relatorios/mensal')
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
    if (!data) {
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
      ['Relatório Mensal', hoje],
      ['Faturamento do Mês', formatCurrency(data.faturamento)],
      ['Faturamento Mês Anterior', formatCurrency(data.faturamentoMesAnterior)],
      ['Variação', `${data.diferenca >= 0 ? '+' : ''}${formatCurrency(data.diferenca)}`],
      ['Variação %', `${data.diferenca >= 0 ? '+' : ''}${data.percentualVariacao.toFixed(2)}%`],
      ['Total de Vendas', data.totalVendas],
      [],
    ]

    // Produtos Mais Vendidos
    const produtosHeaders = ['Produto', 'Quantidade', 'Total']
    const produtosRows = data.produtosMaisVendidos.map(produto => [
      produto.nome,
      produto.quantidade,
      formatCurrency(produto.total),
    ])

    // Curva ABC - Resumo
    const abcResumo = [
      [],
      'Curva ABC - Resumo',
      ['Classe', 'Quantidade de Produtos', '% do Faturamento', 'Faturamento'],
      ['A', data.curvaABC.resumo.classeA.quantidade, `${data.curvaABC.resumo.classeA.percentual.toFixed(2)}%`, formatCurrency(data.curvaABC.resumo.classeA.faturamento)],
      ['B', data.curvaABC.resumo.classeB.quantidade, `${data.curvaABC.resumo.classeB.percentual.toFixed(2)}%`, formatCurrency(data.curvaABC.resumo.classeB.faturamento)],
      ['C', data.curvaABC.resumo.classeC.quantidade, `${data.curvaABC.resumo.classeC.percentual.toFixed(2)}%`, formatCurrency(data.curvaABC.resumo.classeC.faturamento)],
      [],
    ]

    // Curva ABC - Detalhada
    const abcHeaders = ['Classificação', 'Produto', 'Faturamento', '% Individual', '% Acumulado']
    const abcRows = data.curvaABC.produtos.map(produto => [
      produto.classificacao,
      produto.nome,
      formatCurrency(produto.total),
      `${produto.percentual.toFixed(2)}%`,
      `${produto.percentualAcumulado.toFixed(2)}%`,
    ])

    const csvContent = [
      ...resumo.map(row => row.map(escapeCSV).join(separator)),
      'Produtos Mais Vendidos',
      produtosHeaders.map(escapeCSV).join(separator),
      ...produtosRows.map(row => row.map(escapeCSV).join(separator)),
      ...abcResumo.map(row => Array.isArray(row) ? row.map(escapeCSV).join(separator) : row),
      'Curva ABC - Detalhada',
      abcHeaders.map(escapeCSV).join(separator),
      ...abcRows.map(row => row.map(escapeCSV).join(separator)),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_mensal_${hoje}.csv`)
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
          <h1 className={styles.title}>Relatório Mensal</h1>
          <p className={styles.subtitle}>Análise de vendas do mês</p>
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
              Faturamento do Mês
              <TrendingUpIcon size={16} color="#10b981" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.faturamento)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <BarChartIcon size={48} color="#6b7280" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Mês Anterior
              <TrendingUpIcon size={16} color="#6b7280" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{formatCurrency(data.faturamentoMesAnterior)}</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <TrendingUpIcon size={48} color={data.diferenca >= 0 ? '#059669' : '#dc2626'} className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Variação
              <TrendingUpIcon size={16} color={data.diferenca >= 0 ? '#059669' : '#dc2626'} className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue} style={{ color: data.diferenca >= 0 ? '#059669' : '#dc2626' }}>
              {data.diferenca >= 0 ? '+' : ''}{formatCurrency(data.diferenca)}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: data.diferenca >= 0 ? '#059669' : '#dc2626', 
              marginTop: '6px',
              fontWeight: 600,
            }}>
              {data.diferenca >= 0 ? '+' : ''}{data.percentualVariacao.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <ShoppingCartIcon size={48} color="#3b82f6" className={styles.metricCardIcon} />
          <div className={styles.metricCardContent}>
            <div className={styles.metricLabel}>
              Total de Vendas
              <TrendingUpIcon size={16} color="#3b82f6" className={styles.metricTrendIcon} />
            </div>
            <div className={styles.metricValue}>{data.totalVendas}</div>
          </div>
        </div>
      </div>

      {/* Produtos Mais Vendidos */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Produtos Mais Vendidos</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.produtosMaisVendidos.map((produto, index) => (
                <tr key={index}>
                  <td>{produto.nome}</td>
                  <td className={styles.numberCell}>{produto.quantidade}</td>
                  <td className={styles.numberCell}>{formatCurrency(produto.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Curva ABC */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Curva ABC</h2>
        
        {/* Resumo da Curva ABC */}
        <div className={styles.abcResumo}>
          <div className={styles.abcItem} style={{ borderLeft: '4px solid #059669' }}>
            <div className={styles.abcLabel}>Classe A</div>
            <div className={styles.abcValue}>{data.curvaABC.resumo.classeA.quantidade} produtos</div>
            <div className={styles.abcPercent}>{data.curvaABC.resumo.classeA.percentual.toFixed(2)}% do faturamento</div>
            <div className={styles.abcTotal}>{formatCurrency(data.curvaABC.resumo.classeA.faturamento)}</div>
          </div>
          <div className={styles.abcItem} style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className={styles.abcLabel}>Classe B</div>
            <div className={styles.abcValue}>{data.curvaABC.resumo.classeB.quantidade} produtos</div>
            <div className={styles.abcPercent}>{data.curvaABC.resumo.classeB.percentual.toFixed(2)}% do faturamento</div>
            <div className={styles.abcTotal}>{formatCurrency(data.curvaABC.resumo.classeB.faturamento)}</div>
          </div>
          <div className={styles.abcItem} style={{ borderLeft: '4px solid #6b7280' }}>
            <div className={styles.abcLabel}>Classe C</div>
            <div className={styles.abcValue}>{data.curvaABC.resumo.classeC.quantidade} produtos</div>
            <div className={styles.abcPercent}>{data.curvaABC.resumo.classeC.percentual.toFixed(2)}% do faturamento</div>
            <div className={styles.abcTotal}>{formatCurrency(data.curvaABC.resumo.classeC.faturamento)}</div>
          </div>
        </div>

        {/* Tabela Completa da Curva ABC */}
        <div className={styles.tableContainer} style={{ marginTop: '24px' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Classificação</th>
                <th>Produto</th>
                <th>Faturamento</th>
                <th>% Individual</th>
                <th>% Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {data.curvaABC.produtos.map((produto, index) => (
                <tr key={index}>
                  <td>
                    <span className={styles.classBadge} data-class={produto.classificacao}>
                      {produto.classificacao}
                    </span>
                  </td>
                  <td>{produto.nome}</td>
                  <td className={styles.numberCell}>{formatCurrency(produto.total)}</td>
                  <td className={styles.numberCell}>{produto.percentual.toFixed(2)}%</td>
                  <td className={styles.numberCell}>{produto.percentualAcumulado.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

