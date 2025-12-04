'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './financeiro.module.css'
import { FileTextIcon, FilterIcon, XIcon, DownloadIcon } from '@/components/icons'

interface Movimentacao {
  id: string
  tipo: 'pagamento' | 'recebimento'
  descricao: string
  valor: number
  data: string
  fornecedor?: string
  cliente?: string
  tipoTransacao: string
}

export default function ExtratoMovimentacaoPage() {
  const [loading, setLoading] = useState(true)
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [filtros, setFiltros] = useState({
    dataInicial: '',
    dataFinal: '',
  })

  useEffect(() => {
    fetchMovimentacoes()
  }, [])

  const fetchMovimentacoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financeiro/extrato-movimentacao')
      if (response.ok) {
        const data = await response.json()
        setMovimentacoes(data)
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar movimentações por data
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((mov) => {
      if (filtros.dataInicial || filtros.dataFinal) {
        const dataMov = new Date(mov.data)
        dataMov.setHours(0, 0, 0, 0)

        if (filtros.dataInicial) {
          const dataInicial = new Date(filtros.dataInicial)
          dataInicial.setHours(0, 0, 0, 0)
          if (dataMov < dataInicial) {
            return false
          }
        }

        if (filtros.dataFinal) {
          const dataFinal = new Date(filtros.dataFinal)
          dataFinal.setHours(23, 59, 59, 999)
          if (dataMov > dataFinal) {
            return false
          }
        }
      }

      return true
    })
  }, [movimentacoes, filtros])

  // Calcular saldo
  const saldo = useMemo(() => {
    return movimentacoesFiltradas.reduce((acc, mov) => {
      if (mov.tipo === 'recebimento') {
        return acc + mov.valor
      } else {
        return acc - mov.valor
      }
    }, 0)
  }, [movimentacoesFiltradas])

  // Ordenar por data (mais recente primeiro)
  const movimentacoesOrdenadas = useMemo(() => {
    return [...movimentacoesFiltradas].sort((a, b) => {
      return new Date(b.data).getTime() - new Date(a.data).getTime()
    })
  }, [movimentacoesFiltradas])

  const limparFiltros = () => {
    setFiltros({
      dataInicial: '',
      dataFinal: '',
    })
  }

  const temFiltrosAtivos = filtros.dataInicial || filtros.dataFinal

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleExportCSV = () => {
    if (movimentacoesOrdenadas.length === 0) {
      alert('Não há movimentações para exportar')
      return
    }

    const escapeCSV = (value: string | number | null): string => {
      if (value === null || value === undefined) return '""'
      const str = String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const separator = ';'
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')

    const headers = [
      'Data',
      'Tipo',
      'Descrição',
      'Fornecedor/Cliente',
      'Tipo de Transação',
      'Valor',
    ]

    const rows = movimentacoesOrdenadas.map((mov) => [
      formatDate(mov.data),
      mov.tipo === 'pagamento' ? 'Pagamento' : 'Recebimento',
      mov.descricao,
      mov.fornecedor || mov.cliente || '-',
      mov.tipoTransacao,
      mov.valor.toString(),
    ])

    const csvContent = [
      headers.map(escapeCSV).join(separator),
      ...rows.map((row) => row.map(escapeCSV).join(separator)),
      '',
      `"Saldo Final","${formatCurrency(saldo)}"`,
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `extrato_movimentacao_${hoje}.csv`)
    link.style.visibility = 'hidden'
    link.style.position = 'absolute'
    link.style.top = '-9999px'

    if (document.body) {
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        try {
          if (link.parentNode && document.body.contains(link)) {
            document.body.removeChild(link)
          }
        } catch (e) {
          // Ignorar erro se o elemento já foi removido
        }
        try {
          URL.revokeObjectURL(url)
        } catch (e) {
          // Ignorar erro se a URL já foi revogada
        }
      }, 100)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Extrato de Movimentação Financeira</h1>
          <p className={styles.subtitle}>Registro de todos os pagamentos e recebimentos</p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={movimentacoesOrdenadas.length === 0}
          className={styles.exportButton}
        >
          <DownloadIcon size={18} color="currentColor" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersHeader}>
          <div className={styles.filtersTitle}>
            <FilterIcon size={18} color="#6b7280" />
            <span>Filtros</span>
          </div>
          {temFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className={styles.clearFiltersButton}
            >
              <XIcon size={14} color="currentColor" />
              Limpar Filtros
            </button>
          )}
        </div>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Data Inicial</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filtros.dataInicial}
              onChange={(e) => setFiltros((prev) => ({ ...prev, dataInicial: e.target.value }))}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Data Final</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filtros.dataFinal}
              onChange={(e) => setFiltros((prev) => ({ ...prev, dataFinal: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Card de Saldo */}
      <div className={styles.saldoCard}>
        <div className={styles.saldoHeader}>
          <FileTextIcon size={24} color={saldo >= 0 ? '#059669' : '#dc2626'} />
          <h2 className={styles.saldoTitle}>Saldo Final</h2>
        </div>
        <div className={styles.saldoValue} style={{ color: saldo >= 0 ? '#059669' : '#dc2626' }}>
          {formatCurrency(saldo)}
        </div>
        <div className={styles.saldoStatus} style={{ color: saldo >= 0 ? '#059669' : '#dc2626' }}>
          {saldo >= 0 ? 'Saldo Positivo' : 'Saldo Negativo'}
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <FileTextIcon size={24} color="#1f2937" />
            <h2 className={styles.cardTitle}>Movimentações</h2>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Carregando movimentações...</div>
        ) : movimentacoesOrdenadas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {movimentacoes.length === 0
                ? 'Nenhuma movimentação registrada ainda.'
                : 'Nenhuma movimentação encontrada com os filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Fornecedor/Cliente</th>
                  <th>Tipo de Transação</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesOrdenadas.map((mov) => (
                  <tr key={mov.id}>
                    <td className={styles.dataCell}>{formatDate(mov.data)}</td>
                    <td className={styles.tipoCell}>
                      <span
                        className={
                          mov.tipo === 'pagamento'
                            ? styles.badgePagamento
                            : styles.badgeRecebimento
                        }
                      >
                        {mov.tipo === 'pagamento' ? 'Pagamento' : 'Recebimento'}
                      </span>
                    </td>
                    <td className={styles.descricaoCell}>{mov.descricao}</td>
                    <td className={styles.nomeCell}>{mov.fornecedor || mov.cliente || '-'}</td>
                    <td className={styles.tipoCell}>{mov.tipoTransacao}</td>
                    <td
                      className={styles.valorCell}
                      style={{ color: mov.tipo === 'pagamento' ? '#dc2626' : '#059669' }}
                    >
                      {mov.tipo === 'pagamento' ? '-' : '+'}
                      {formatCurrency(mov.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

