import styles from './ActivityItem.module.css'

interface ActivityItemProps {
  icon: string
  text: string
  iconColor?: string
}

export default function ActivityItem({
  icon,
  text,
  iconColor = '#3b82f6',
}: ActivityItemProps) {
  return (
    <div className={styles.item}>
      <div className={styles.icon} style={{ color: iconColor }}>
        {icon}
      </div>
      <div className={styles.text}>{text}</div>
    </div>
  )
}

