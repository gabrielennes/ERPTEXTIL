'use client'

import { useState, useEffect } from 'react'
import styles from './ProductModal.module.css'

interface Variacao {
  sku: string
  codigoBarras: string
  rfid: string
  tamanho: string
  cor: string
  estoque: number
  preco: string
}

interface ProdutoEdit {
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
  variacoes: Array<{
    id?: string
    sku: string
    codigoBarras: string | null
    rfid: string | null
    tamanho: string | null
    cor: string | null
    estoque: number
    preco: number | null
  }>
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any, id?: string) => void
  produto?: ProdutoEdit | null
}

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  produto,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    peso: '',
    precoCusto: '',
    descricao: '',
    categoria: '',
    ncm: '',
    dimensoes: '',
    precoVenda: '',
  })

  const [variacoes, setVariacoes] = useState<Variacao[]>([
    {
      sku: '',
      codigoBarras: '',
      rfid: '',
      tamanho: '',
      cor: '',
      estoque: 0,
      preco: '',
    },
  ])

  // Preencher formulário quando estiver editando ou resetar quando fechar
  useEffect(() => {
    if (!isOpen) {
      // Resetar quando fechar
      setFormData({
        nome: '',
        marca: '',
        peso: '',
        precoCusto: '',
        descricao: '',
        categoria: '',
        ncm: '',
        dimensoes: '',
        precoVenda: '',
      })
      setVariacoes([
        {
          sku: '',
          codigoBarras: '',
          rfid: '',
          tamanho: '',
          cor: '',
          estoque: 0,
          preco: '',
        },
      ])
    } else if (produto) {
      // Preencher quando estiver editando
      setFormData({
        nome: produto.nome,
        marca: produto.marca || '',
        peso: produto.peso?.toString() || '',
        precoCusto: produto.precoCusto?.toString() || '',
        descricao: produto.descricao || '',
        categoria: produto.categoria || '',
        ncm: produto.ncm || '',
        dimensoes: produto.dimensoes || '',
        precoVenda: produto.precoVenda.toString(),
      })
      setVariacoes(
        produto.variacoes.length > 0
          ? produto.variacoes.map((v) => ({
              sku: v.sku,
              codigoBarras: v.codigoBarras || '',
              rfid: v.rfid || '',
              tamanho: v.tamanho || '',
              cor: v.cor || '',
              estoque: v.estoque,
              preco: v.preco?.toString() || '',
            }))
          : [
              {
                sku: '',
                codigoBarras: '',
                rfid: '',
                tamanho: '',
                cor: '',
                estoque: 0,
                preco: '',
              },
            ]
      )
    }
  }, [isOpen, produto])

  if (!isOpen) return null

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVariacaoChange = (
    index: number,
    field: keyof Variacao,
    value: string | number
  ) => {
    setVariacoes((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addVariacao = () => {
    setVariacoes([
      ...variacoes,
      {
        sku: '',
        codigoBarras: '',
        rfid: '',
        tamanho: '',
        cor: '',
        estoque: 0,
        preco: '',
      },
    ])
  }

  const removeVariacao = (index: number) => {
    if (variacoes.length > 1) {
      setVariacoes(variacoes.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const produtoData = {
      ...formData,
      peso: formData.peso ? parseFloat(formData.peso) : null,
      precoCusto: formData.precoCusto ? parseFloat(formData.precoCusto) : null,
      precoVenda: parseFloat(formData.precoVenda),
      variacoes: variacoes.map((v) => ({
        ...v,
        estoque: v.estoque,
        preco: v.preco ? parseFloat(v.preco) : null,
      })),
    }

    onSave(produtoData, produto?.id)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="nome" className={styles.label}>
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="marca" className={styles.label}>
                  Marca
                </label>
                <input
                  type="text"
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="peso" className={styles.label}>
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="peso"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="precoCusto" className={styles.label}>
                  Preço de Custo
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="precoCusto"
                  name="precoCusto"
                  value={formData.precoCusto}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="descricao" className={styles.label}>
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label htmlFor="categoria" className={styles.label}>
                  Categoria
                </label>
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ncm" className={styles.label}>
                  NCM
                </label>
                <input
                  type="text"
                  id="ncm"
                  name="ncm"
                  value={formData.ncm}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="dimensoes" className={styles.label}>
                  Dimensões (LxAxP)
                </label>
                <input
                  type="text"
                  id="dimensoes"
                  name="dimensoes"
                  value={formData.dimensoes}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="ex: 30×20×5"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="precoVenda" className={styles.label}>
                  Preço de Venda *
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="precoVenda"
                  name="precoVenda"
                  value={formData.precoVenda}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.variacoesSection}>
            <div className={styles.variacoesHeader}>
              <h3 className={styles.variacoesTitle}>Variações (SKU)</h3>
              <button
                type="button"
                onClick={addVariacao}
                className={styles.addVariacaoButton}
              >
                + Adicionar Variação
              </button>
            </div>

            {variacoes.map((variacao, index) => (
              <div key={index} className={styles.variacaoCard}>
                <div className={styles.variacaoHeader}>
                  <h4 className={styles.variacaoTitle}>Variação {index + 1}</h4>
                  {variacoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariacao(index)}
                      className={styles.deleteButton}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className={styles.variacaoGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={variacao.sku}
                      onChange={(e) =>
                        handleVariacaoChange(index, 'sku', e.target.value)
                      }
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={variacao.codigoBarras}
                      onChange={(e) =>
                        handleVariacaoChange(
                          index,
                          'codigoBarras',
                          e.target.value
                        )
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>RFID</label>
                    <input
                      type="text"
                      value={variacao.rfid}
                      onChange={(e) =>
                        handleVariacaoChange(index, 'rfid', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tamanho</label>
                    <input
                      type="text"
                      value={variacao.tamanho}
                      onChange={(e) =>
                        handleVariacaoChange(index, 'tamanho', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cor</label>
                    <input
                      type="text"
                      value={variacao.cor}
                      onChange={(e) =>
                        handleVariacaoChange(index, 'cor', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estoque</label>
                    <input
                      type="number"
                      value={variacao.estoque}
                      onChange={(e) =>
                        handleVariacaoChange(
                          index,
                          'estoque',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Preço (opcional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={variacao.preco}
                      onChange={(e) =>
                        handleVariacaoChange(index, 'preco', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              💾 Salvar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

