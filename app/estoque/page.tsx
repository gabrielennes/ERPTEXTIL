'use client'

import { useState, useEffect } from 'react'
import styles from './estoque.module.css'

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

  const totalVariacoes = produtos.reduce(
    (acc, p) => acc + p.variacoes.length,
    0
  )
  const totalEstoque = produtos.reduce(
    (acc, p) =>
      acc + p.variacoes.reduce((sum, v) => sum + v.estoque, 0),
    0
  )
  const produtosComEstoqueBaixo = produtos.filter((p) =>
    p.variacoes.some((v) => v.estoque < 10)
  ).length

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
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📦</div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{produtos.length}</div>
            <div className={styles.metricLabel}>Produtos</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📋</div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{totalVariacoes}</div>
            <div className={styles.metricLabel}>Variações</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>📊</div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>{totalEstoque}</div>
            <div className={styles.metricLabel}>Total em Estoque</div>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>⚠️</div>
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

