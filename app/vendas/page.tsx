'use client'

import styles from './vendas.module.css'
import { ClockIcon } from '@/components/icons'

export default function VendasPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Histórico de Vendas</h1>
      <p className={styles.subtitle}>Vendas realizadas</p>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ClockIcon size={64} color="#7c3aed" />
          </div>
          <h2>Nenhuma venda realizada</h2>
          <p>As vendas realizadas aparecerão aqui</p>
        </div>
      </div>
    </div>
  )
}

