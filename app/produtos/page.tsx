'use client'

import { useState, useEffect } from 'react'
import ProductModal from '@/components/ProductModal'
import ViewProductModal from '@/components/ViewProductModal'
import { DownloadIcon, EyeIcon, EditIcon, BoxIcon, PlusIcon } from '@/components/icons'
import styles from './produtos.module.css'

interface Variacao {
  id: string
  sku: string
  codigoBarras: string | null
  rfid: string | null
  tamanho: string | null
  cor: string | null
  estoque: number
  preco: number | null
}

interface Produto {
  id: string
  nome: string
  marca: string | null
  peso: number | null
  precoCusto: number | null
  descricao: string | null
  categoria: string | null
  ncm: string | null
  dimensoes: string | null
  precoVenda: number
  variacoes: Variacao[]
  createdAt: string
  updatedAt: string
}

export default function ProdutosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchProdutos()
  }, [])

  const handleSave = async (data: any, produtoId?: string) => {
    try {
      const url = produtoId ? `/api/produtos/${produtoId}` : '/api/produtos'
      const method = produtoId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsModalOpen(false)
        setSelectedProduto(null)
        fetchProdutos()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar produto')
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    }
  }

  const handleView = async (produtoId: string) => {
    try {
      const response = await fetch(`/api/produtos/${produtoId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedProduto(data)
        setIsViewModalOpen(true)
      } else {
        alert('Erro ao carregar produto')
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      alert('Erro ao buscar produto')
    }
  }

  const handleEdit = () => {
    setIsViewModalOpen(false)
    setIsModalOpen(true)
  }

  const handleExportCSV = () => {
    if (produtos.length === 0) {
      alert('Não há produtos para exportar')
      return
    }

    // Cabeçalhos do CSV
    const headers = [
      'Nome do Produto',
      'Marca',
      'Peso (kg)',
      'Preço de Custo',
      'Descrição',
      'Categoria',
      'NCM',
      'Dimensões',
      'Preço de Venda',
      'Data de Cadastro',
      'SKU',
      'Código de Barras',
      'RFID',
      'Tamanho',
      'Cor',
      'Estoque',
      'Preço Variação',
    ]

    // Criar linhas do CSV
    const rows: string[][] = []
    
    produtos.forEach((produto) => {
      const dataCadastro = new Date(produto.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })

      // Se o produto tem variações, criar uma linha para cada variação
      if (produto.variacoes.length > 0) {
        produto.variacoes.forEach((variacao) => {
          rows.push([
            produto.nome,
            produto.marca || '',
            produto.peso?.toString() || '',
            produto.precoCusto?.toString() || '',
            produto.descricao || '',
            produto.categoria || '',
            produto.ncm || '',
            produto.dimensoes || '',
            produto.precoVenda.toString(),
            dataCadastro,
            variacao.sku,
            variacao.codigoBarras || '',
            variacao.rfid || '',
            variacao.tamanho || '',
            variacao.cor || '',
            variacao.estoque.toString(),
            variacao.preco?.toString() || '',
          ])
        })
      } else {
        // Se não tem variações, criar uma linha sem dados de variação
        rows.push([
          produto.nome,
          produto.marca || '',
          produto.peso?.toString() || '',
          produto.precoCusto?.toString() || '',
          produto.descricao || '',
          produto.categoria || '',
          produto.ncm || '',
          produto.dimensoes || '',
          produto.precoVenda.toString(),
          dataCadastro,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ])
      }
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
    
    link.setAttribute('download', `produtos_${dataFormatada}.csv`)
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

  const handleOpenEdit = async (produtoId: string) => {
    try {
      const response = await fetch(`/api/produtos/${produtoId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedProduto(data)
        setIsModalOpen(true)
      } else {
        alert('Erro ao carregar produto')
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      alert('Erro ao buscar produto')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cadastro de Produtos</h1>
          <p className={styles.subtitle}>Gestão de produtos e variações</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={styles.exportButton}
            onClick={handleExportCSV}
            disabled={produtos.length === 0}
          >
            <DownloadIcon size={18} color="white" />
            Exportar CSV
          </button>
          <button
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon size={18} color="white" />
            Adicionar Produto
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <BoxIcon size={64} color="#3b82f6" />
            </div>
            <h2>Nenhum produto cadastrado</h2>
            <p>Comece cadastrando seu primeiro produto</p>
            <button
              className={styles.addButton}
              onClick={() => setIsModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlusIcon size={18} color="white" />
              Adicionar Produto
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Variações</th>
                <th>Total em Estoque</th>
                <th>SKUs</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => {
                const totalEstoque = produto.variacoes.reduce(
                  (acc, v) => acc + v.estoque,
                  0
                )
                return (
                  <tr key={produto.id}>
                    <td>
                      <div className={styles.productName}>{produto.nome}</div>
                      {produto.marca && (
                        <div className={styles.productBrand}>
                          {produto.marca}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={styles.productPrice}>
                        R$ {produto.precoVenda.toFixed(2)}
                      </span>
                    </td>
                    <td>{produto.categoria || '-'}</td>
                    <td>{produto.variacoes.length}</td>
                    <td>
                      <span className={styles.stockValue}>
                        {totalEstoque}
                      </span>
                    </td>
                    <td>
                      <div className={styles.skuTags}>
                        {produto.variacoes.slice(0, 3).map((v) => (
                          <span key={v.id} className={styles.skuTag}>
                            {v.sku}
                          </span>
                        ))}
                        {produto.variacoes.length > 3 && (
                          <span className={styles.skuMore}>
                            +{produto.variacoes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.viewButton}
                          onClick={() => handleView(produto.id)}
                          title="Visualizar"
                        >
                          <EyeIcon size={18} color="currentColor" />
                        </button>
                        <button
                          className={styles.editButton}
                          onClick={() => handleOpenEdit(produto.id)}
                          title="Editar"
                        >
                          <EditIcon size={18} color="currentColor" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ViewProductModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedProduto(null)
        }}
        produto={selectedProduto}
        onEdit={handleEdit}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduto(null)
        }}
        onSave={handleSave}
        produto={selectedProduto}
      />
    </div>
  )
}

