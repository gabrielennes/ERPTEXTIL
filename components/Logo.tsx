'use client'

interface LogoProps {
  className?: string
  size?: number
}

export function CompanyLogo({ className = '', size = 60 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Quadrado azul sólido com cantos arredondados */}
      <rect width="60" height="60" rx="6" fill="#3b82f6" />
      
      {/* Padrão de grade branco */}
      <g stroke="white" strokeWidth="1.5" opacity="0.9">
        {/* Linhas horizontais */}
        <line x1="10" y1="12" x2="50" y2="12" />
        <line x1="10" y1="18" x2="50" y2="18" />
        <line x1="10" y1="24" x2="50" y2="24" />
        <line x1="10" y1="30" x2="50" y2="30" />
        <line x1="10" y1="36" x2="50" y2="36" />
        <line x1="10" y1="42" x2="50" y2="42" />
        <line x1="10" y1="48" x2="50" y2="48" />
        
        {/* Linhas verticais */}
        <line x1="12" y1="10" x2="12" y2="50" />
        <line x1="18" y1="10" x2="18" y2="50" />
        <line x1="24" y1="10" x2="24" y2="50" />
        <line x1="30" y1="10" x2="30" y2="50" />
        <line x1="36" y1="10" x2="36" y2="50" />
        <line x1="42" y1="10" x2="42" y2="50" />
        <line x1="48" y1="10" x2="48" y2="50" />
      </g>
    </svg>
  )
}

