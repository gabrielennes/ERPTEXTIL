'use client'

import styles from './ViewProductModal.module.css'

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

interface ViewProductModalProps {
  isOpen: boolean
  onClose: () => void
  produto: Produto | null
  onEdit: () => void
}

export default function ViewProductModal({
  isOpen,
  onClose,
  produto,
  onEdit,
}: ViewProductModalProps) {
  if (!isOpen || !produto) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Detalhes do Produto</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome do Produto</label>
                <div className={styles.value}>{produto.nome}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Marca</label>
                <div className={styles.value}>{produto.marca || '-'}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Peso (kg)</label>
                <div className={styles.value}>
                  {produto.peso ? `${produto.peso} kg` : '-'}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Preço de Custo</label>
                <div className={styles.value}>
                  {produto.precoCusto
                    ? `R$ ${produto.precoCusto.toFixed(2)}`
                    : '-'}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Descrição</label>
                <div className={styles.value}>
                  {produto.descricao || '-'}
                </div>
              </div>
            </div>

            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Categoria</label>
                <div className={styles.value}>{produto.categoria || '-'}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>NCM</label>
                <div className={styles.value}>{produto.ncm || '-'}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dimensões (LxAxP)</label>
                <div className={styles.value}>{produto.dimensoes || '-'}</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Preço de Venda</label>
                <div className={styles.value}>
                  R$ {produto.precoVenda.toFixed(2)}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Data de Criação</label>
                <div className={styles.value}>
                  {new Date(produto.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.variacoesSection}>
            <h3 className={styles.variacoesTitle}>
              Variações (SKU) - {produto.variacoes.length}
            </h3>

            <div className={styles.variacoesGrid}>
              {produto.variacoes.map((variacao) => (
                <div key={variacao.id} className={styles.variacaoCard}>
                  <div className={styles.variacaoHeader}>
                    <h4 className={styles.variacaoTitle}>SKU: {variacao.sku}</h4>
                  </div>
                  <div className={styles.variacaoGrid}>
                    <div className={styles.variacaoItem}>
                      <label className={styles.label}>Código de Barras</label>
                      <div className={styles.value}>
                        {variacao.codigoBarras || '-'}
                      </div>
                    </div>
                    <div className={styles.variacaoItem}>
                      <label className={styles.label}>RFID</label>
                      <div className={styles.value}>{variacao.rfid || '-'}</div>
                    </div>
                    <div className={styles.variacaoItem}>
                      <label className={styles.label}>Tamanho</label>
                      <div className={styles.value}>
                        {variacao.tamanho || '-'}
                      </div>
                    </div>
                    <div className={styles.variacaoItem}>
                      <label className={styles.label}>Cor</label>
                      <div className={styles.value}>{variacao.cor || '-'}</div>
                    </div>
                    <div className={styles.variacaoItem}>
                      <label className={styles.label}>Estoque</label>
                      <div className={styles.value}>{variacao.estoque}</div>
                    </div>
                    <div className={styles.variacaoItem}>
                      <label className={styles.label}>Preço</label>
                      <div className={styles.value}>
                        {variacao.preco
                          ? `R$ ${variacao.preco.toFixed(2)}`
                          : 'Usar preço do produto'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Fechar
          </button>
          <button onClick={onEdit} className={styles.editButton}>
            ✏️ Editar Produto
          </button>
        </div>
      </div>
    </div>
  )
}

