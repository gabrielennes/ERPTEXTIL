import styles from './MetricCard.module.css'

interface MetricCardProps {
  title: string
  value: string
  icon: string
  iconColor?: string
}

export default function MetricCard({
  title,
  value,
  icon,
  iconColor = '#3b82f6',
}: MetricCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.icon} style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}

