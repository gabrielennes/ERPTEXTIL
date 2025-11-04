import styles from './produtos.module.css'

export default function ProdutosPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro de Produtos</h1>
      <p className={styles.subtitle}>Gestão de produtos e variações</p>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h2>Nenhum produto cadastrado</h2>
          <p>Comece cadastrando seu primeiro produto</p>
          <button className={styles.addButton}>+ Adicionar Produto</button>
        </div>
      </div>
    </div>
  )
}

