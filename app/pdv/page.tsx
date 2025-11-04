import styles from './pdv.module.css'

export default function PDVPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PDV - Vendas</h1>
      <p className={styles.subtitle}>Ponto de venda</p>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>PDV Disponível</h2>
          <p>Sistema pronto para realizar vendas</p>
          <button className={styles.startButton}>Iniciar Venda</button>
        </div>
      </div>
    </div>
  )
}

