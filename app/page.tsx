import MetricCard from '@/components/MetricCard'
import ActionCard from '@/components/ActionCard'
import ActivityItem from '@/components/ActivityItem'
import {
  BoxIcon,
  LayersIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  ClockIcon,
} from '@/components/icons'
import { CompanyLogo } from '@/components/Logo'
import styles from './dashboard.module.css'

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.welcomeBanner}>
          <CompanyLogo size={60} className={styles.welcomeLogo} />
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Fibras & Estilos</h1>
            <p className={styles.welcomeSubtitle}>
              Sistema completo para gestão de vendas e produtos
            </p>
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Dashboard</h2>

      <div className={styles.metricsGrid}>
        <MetricCard
          title="Total de Produtos"
          value="0"
          icon={<BoxIcon size={24} />}
          iconColor="#3b82f6"
        />
        <MetricCard
          title="Variações Cadastradas"
          value="0"
          icon={<LayersIcon size={24} />}
          iconColor="#3b82f6"
        />
        <MetricCard
          title="Vendas Hoje"
          value="R$ 0,00"
          icon={<TrendingUpIcon size={24} />}
          iconColor="#10b981"
        />
        <MetricCard
          title="Total de Vendas"
          value="R$ 0,00"
          icon={<DollarSignIcon size={24} />}
          iconColor="#10b981"
        />
      </div>

      <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
      <div className={styles.actionsGrid}>
        <ActionCard
          href="/produtos"
          icon={<BoxIcon size={48} />}
          title="Cadastro de Produtos"
          description="Gerenciar produtos e variações"
          iconColor="#1e40af"
        />
        <ActionCard
          href="/pdv"
          icon={<ShoppingCartIcon size={48} />}
          title="PDV - Vendas"
          description="Realizar vendas"
          iconColor="#059669"
        />
        <ActionCard
          href="/vendas"
          icon={<ClockIcon size={48} />}
          title="Histórico de Vendas"
          description="Consultar vendas realizadas"
          iconColor="#7c3aed"
        />
      </div>

      <h2 className={styles.sectionTitle}>Atividade Recente</h2>
      <div className={styles.activityList}>
        <ActivityItem
          icon={<BoxIcon size={20} />}
          text="Produtos cadastrados: Sistema inicializado com produtos de exemplo"
          iconColor="#3b82f6"
        />
        <ActivityItem
          icon={<ShoppingCartIcon size={20} />}
          text="PDV disponível: Sistema pronto para realizar vendas"
          iconColor="#10b981"
        />
      </div>

      <h2 className={styles.sectionTitle}>Informações do Sistema</h2>
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>Funcionalidades Disponíveis</h3>
          <ul className={styles.infoList}>
            <li>Cadastro de produtos com variações</li>
          </ul>
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoTitle}>Próximas Integrações</h3>
          <ul className={styles.infoList}>
            <li>Sistema de estoque</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
