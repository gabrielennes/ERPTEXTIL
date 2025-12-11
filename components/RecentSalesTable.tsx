'use client'

import { ShoppingCartIcon } from '@/components/icons'
import styles from './RecentSalesTable.module.css'

interface Venda {
  id: string
  numero?: string | null
  total: number
  parcelas?: number
  data: string
  produtos: Array<{
    nome: string
    quantidade: number
    precoUnitario: number
  }>
}

interface RecentSalesTableProps {
  vendas: Venda[]
}

export default function RecentSalesTable({ vendas }: RecentSalesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (vendas.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <ShoppingCartIcon size={48} color="#059669" />
        </div>
        <div className={styles.emptyTitle}>
          Nenhuma venda realizada ainda
        </div>
        <div className={styles.emptyDescription}>
          As vendas aparecerão aqui quando forem realizadas
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.thead}>
            <th className={styles.th}>
              N° Pedido
            </th>
            <th className={styles.th}>
              Produto
            </th>
            <th className={`${styles.th} ${styles.thRight}`}>
              Valor
            </th>
            <th className={`${styles.th} ${styles.thRight}`}>
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((venda) => (
            <tr key={venda.id} className={styles.tr}>
              <td className={`${styles.td} ${styles.tdBold}`}>
                {venda.numero || `#${venda.id.slice(-8).toUpperCase()}`}
              </td>
              <td className={styles.td}>
                {venda.produtos.length > 0 ? (
                  <div>
                    <div className={styles.productName}>
                      {venda.produtos[0].nome}
                    </div>
                    {venda.produtos.length > 1 && (
                      <div className={styles.productSubtext}>
                        +{venda.produtos.length - 1} outro(s) produto(s)
                      </div>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdValue}`}>
                {formatCurrency(venda.total)}
                {venda.parcelas && venda.parcelas > 1 && (
                  <div className={styles.parcelas}>
                    {venda.parcelas}x no cartão
                  </div>
                )}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdSecondary}`}>
                {formatDate(venda.data)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

