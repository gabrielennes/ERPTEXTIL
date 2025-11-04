'use client'

import { useState, useEffect } from 'react'
import ProductModal from '@/components/ProductModal'
import ViewProductModal from '@/components/ViewProductModal'
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
        <button
          className={styles.addButton}
          onClick={() => setIsModalOpen(true)}
        >
          + Adicionar Produto
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h2>Nenhum produto cadastrado</h2>
            <p>Comece cadastrando seu primeiro produto</p>
            <button
              className={styles.addButton}
              onClick={() => setIsModalOpen(true)}
            >
              + Adicionar Produto
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {produtos.map((produto) => (
            <div key={produto.id} className={styles.productCard}>
              <div className={styles.productHeader}>
                <h3 className={styles.productName}>{produto.nome}</h3>
                <span className={styles.productPrice}>
                  R$ {produto.precoVenda.toFixed(2)}
                </span>
              </div>
              <div className={styles.productInfo}>
                {produto.marca && (
                  <div className={styles.infoItem}>
                    <strong>Marca:</strong> {produto.marca}
                  </div>
                )}
                {produto.categoria && (
                  <div className={styles.infoItem}>
                    <strong>Categoria:</strong> {produto.categoria}
                  </div>
                )}
                <div className={styles.infoItem}>
                  <strong>Variações:</strong> {produto.variacoes.length}
                </div>
                <div className={styles.infoItem}>
                  <strong>Total em Estoque:</strong>{' '}
                  {produto.variacoes.reduce((acc, v) => acc + v.estoque, 0)}
                </div>
              </div>
              <div className={styles.variacoesList}>
                <strong>SKUs:</strong>
                <div className={styles.skuTags}>
                  {produto.variacoes.map((v) => (
                    <span key={v.id} className={styles.skuTag}>
                      {v.sku}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.viewButton}
                  onClick={() => handleView(produto.id)}
                >
                  👁️ Visualizar
                </button>
                <button
                  className={styles.editButton}
                  onClick={() => handleOpenEdit(produto.id)}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          ))}
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

