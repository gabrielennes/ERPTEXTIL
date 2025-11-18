import Link from 'next/link'
import { ReactNode } from 'react'
import styles from './ActionCard.module.css'

interface ActionCardProps {
  href: string
  icon: ReactNode
  title: string
  description: string
  iconColor?: string
}

export default function ActionCard({
  href,
  icon,
  title,
  description,
  iconColor = '#3b82f6',
}: ActionCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.icon} style={{ color: iconColor }}>
        {icon}
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </Link>
  )
}

