'use client'

import { useState, useEffect } from 'react'
import styles from './estoque.module.css'
import { Cube3DIcon, StackLayersIcon, MiniChartUpIcon, MiniChartDownIcon, DownloadIcon } from '@/components/icons'

interface Variacao {
  id: string
  sku: string
  codigoBarras: string | null
  tamanho: string | null
  cor: string | null
  estoque: number
}

interface ProdutoEstoque {
  id: string
  nome: string
  marca: string | null
  categoria: string | null
  variacoes: Variacao[]
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const response = await fetch('/api/produtos')
      if (response.ok) {
        const data = await response.json()
        setProdutos(data)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.variacoes.some((v) =>
      v.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Calcular métricas baseadas nos produtos filtrados
  const totalProdutos = produtosFiltrados.length
  const totalVariacoes = produtosFiltrados.reduce(
    (acc, p) => acc + p.variacoes.length,
    0
  )
  const totalEstoque = produtosFiltrados.reduce(
    (acc, p) =>
      acc + p.variacoes.reduce((sum, v) => sum + v.estoque, 0),
    0
  )
  const produtosComEstoqueBaixo = produtosFiltrados.filter((p) =>
    p.variacoes.some((v) => v.estoque < 10)
  ).length

  const handleExportCSV = () => {
    if (produtosFiltrados.length === 0) {
      alert('Não há produtos para exportar')
      return
    }

    // Cabeçalhos do CSV
    const headers = [
      'Produto',
      'Marca',
      'SKU',
      'Tamanho',
      'Cor',
      'Código de Barras',
      'Estoque',
      'Status',
    ]

    // Criar linhas do CSV
    const rows: string[][] = []
    
    produtosFiltrados.forEach((produto) => {
      produto.variacoes.forEach((variacao) => {
        // Determinar status
        let status = ''
        if (variacao.estoque === 0) {
          status = 'Esgotado'
        } else if (variacao.estoque < 10) {
          status = 'Baixo'
        } else if (variacao.estoque < 50) {
          status = 'Médio'
        } else {
          status = 'Bom'
        }

        rows.push([
          produto.nome,
          produto.marca || '',
          variacao.sku,
          variacao.tamanho || '',
          variacao.cor || '',
          variacao.codigoBarras || '',
          variacao.estoque.toString(),
          status,
        ])
      })
    })

    // Função para escapar valores CSV (tratar ponto e vírgula e aspas)
    const escapeCSV = (value: string): string => {
      // Sempre envolver em aspas para garantir que campos com espaços, quebras de linha, etc sejam tratados corretamente
      const escaped = value.replace(/"/g, '""') // Escapar aspas duplas
      return `"${escaped}"`
    }

    // Usar ponto e vírgula como separador (padrão brasileiro)
    const separator = ';'
    
    // Converter para formato CSV
    const csvContent = [
      headers.map(escapeCSV).join(separator),
      ...rows.map((row) => row.map(escapeCSV).join(separator)),
    ].join('\n')

    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Criar link de download
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Nome do arquivo com data atual
    const hoje = new Date()
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-')
    
    link.setAttribute('download', `estoque_${dataFormatada}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Estoque</h1>
          <p className={styles.subtitle}>Controle de estoque</p>
        </div>
        <button
          className={styles.exportButton}
          onClick={handleExportCSV}
          disabled={produtosFiltrados.length === 0}
        >
          <DownloadIcon size={20} color="white" style={{ marginRight: '8px' }} />
          Exportar CSV
        </button>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Cube3DIcon size={32} color="#3b82f6" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{totalProdutos}</div>
            <div className={styles.metricLabel}>Produtos</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <StackLayersIcon size={32} color="#6366f1" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{totalVariacoes}</div>
            <div className={styles.metricLabel}>Variações</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <MiniChartUpIcon size={32} color="#10b981" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{totalEstoque}</div>
            <div className={styles.metricLabel}>Total em Estoque</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <MiniChartDownIcon size={32} color="#ef4444" />
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{produtosComEstoqueBaixo}</div>
            <div className={styles.metricLabel}>Estoque Baixo</div>
          </div>
        </div>
      </div>

      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Buscar por produto ou SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {produtosFiltrados.length === 0 ? (
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h2>
              {searchTerm
                ? 'Nenhum produto encontrado'
                : 'Nenhum produto cadastrado'}
            </h2>
            <p>
              {searchTerm
                ? 'Tente buscar com outro termo'
                : 'Cadastre produtos para ver o estoque'}
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Tamanho</th>
                <th>Cor</th>
                <th>Código de Barras</th>
                <th>Estoque</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((produto) =>
                produto.variacoes.map((variacao) => (
                  <tr key={variacao.id}>
                    <td>
                      <div className={styles.productName}>{produto.nome}</div>
                      {produto.marca && (
                        <div className={styles.productBrand}>
                          {produto.marca}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={styles.skuTag}>{variacao.sku}</span>
                    </td>
                    <td>{variacao.tamanho || '-'}</td>
                    <td>{variacao.cor || '-'}</td>
                    <td>{variacao.codigoBarras || '-'}</td>
                    <td>
                      <span
                        className={`${styles.stockValue} ${
                          variacao.estoque < 10
                            ? styles.stockLow
                            : variacao.estoque < 50
                            ? styles.stockMedium
                            : styles.stockHigh
                        }`}
                      >
                        {variacao.estoque}
                      </span>
                    </td>
                    <td>
                      {variacao.estoque === 0 ? (
                        <span className={styles.statusBadge + ' ' + styles.statusOut}>
                          Esgotado
                        </span>
                      ) : variacao.estoque < 10 ? (
                        <span className={styles.statusBadge + ' ' + styles.statusLow}>
                          Baixo
                        </span>
                      ) : variacao.estoque < 50 ? (
                        <span className={styles.statusBadge + ' ' + styles.statusMedium}>
                          Médio
                        </span>
                      ) : (
                        <span className={styles.statusBadge + ' ' + styles.statusHigh}>
                          Bom
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

