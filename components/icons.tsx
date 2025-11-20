interface IconProps {
  className?: string
  size?: number
  color?: string
}

export function BoxIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

export function LayersIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

export function TrendingUpIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export function DollarSignIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export function ShoppingCartIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export function ClockIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function ClipboardIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

export function BarChartIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

// Cubo 3D isométrico (para Produto)
export function Cube3DIcon({ className = '', size = 24, color = '#3b82f6' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Face superior (topo) */}
      <path d="M12 3L20 7L12 11L4 7L12 3Z" />
      {/* Face frontal (frente) */}
      <path d="M4 7L12 11V19L4 15V7Z" />
      {/* Face lateral direita */}
      <path d="M20 7V15L12 19V11L20 7Z" />
    </svg>
  )
}

// Pilha de camadas (para Variações)
export function StackLayersIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Camada superior (diamante/cubo isométrico) */}
      <path d="M12 2L18 6L12 10L6 6L12 2Z" />
      <path d="M6 6L12 10V14L6 10V6Z" />
      <path d="M18 6V10L12 14V10L18 6Z" />
      {/* Camada do meio (retângulo com offset) */}
      <rect x="5" y="13" width="14" height="3" rx="1" />
      {/* Camada inferior (retângulo com mais offset) */}
      <rect x="7" y="18" width="10" height="3" rx="1" />
    </svg>
  )
}

// Mini gráfico subindo (para Total em Estoque)
export function MiniChartUpIcon({ className = '', size = 32, color = '#10b981' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      {/* Eixos */}
      <line x1="4" y1="28" x2="28" y2="28" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="4" y1="28" x2="4" y2="4" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Barras do gráfico subindo com gradiente sutil */}
      <rect x="6" y="24" width="3" height="4" fill={color} rx="0.5" opacity="0.8" />
      <rect x="10" y="20" width="3" height="8" fill={color} rx="0.5" opacity="0.85" />
      <rect x="14" y="16" width="3" height="12" fill={color} rx="0.5" opacity="0.9" />
      <rect x="18" y="12" width="3" height="16" fill={color} rx="0.5" opacity="0.95" />
      <rect x="22" y="8" width="3" height="20" fill={color} rx="0.5" />
      {/* Linha de tendência ascendente */}
      <polyline
        points="7.5,26 11.5,22 15.5,18 19.5,14 23.5,10"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Seta indicando crescimento */}
      <path
        d="M22 8L25 8L25 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// Mini gráfico descendo (para Estoque Baixo)
export function MiniChartDownIcon({ className = '', size = 32, color = '#ef4444' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
    >
      {/* Eixos */}
      <line x1="4" y1="28" x2="28" y2="28" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="4" y1="28" x2="4" y2="4" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Barras do gráfico descendo com gradiente sutil */}
      <rect x="6" y="8" width="3" height="20" fill={color} rx="0.5" />
      <rect x="10" y="12" width="3" height="16" fill={color} rx="0.5" opacity="0.95" />
      <rect x="14" y="16" width="3" height="12" fill={color} rx="0.5" opacity="0.9" />
      <rect x="18" y="20" width="3" height="8" fill={color} rx="0.5" opacity="0.85" />
      <rect x="22" y="24" width="3" height="4" fill={color} rx="0.5" opacity="0.8" />
      {/* Linha de tendência descendente */}
      <polyline
        points="7.5,10 11.5,14 15.5,18 19.5,22 23.5,26"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Seta indicando declínio */}
      <path
        d="M22 24L25 24L25 27"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// Ícone de download (seta para baixo com linha)
export function DownloadIcon({ className = '', size = 24, color = 'currentColor' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

