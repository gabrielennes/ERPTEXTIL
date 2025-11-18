'use client'

import { useId } from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export function CompanyLogo({ className = '', size = 60 }: LogoProps) {
  const gradientId = useId()
  
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fundo com gradiente */}
      <rect width="60" height="60" rx="12" fill={`url(#${gradientId})`} />
      
      {/* Padrão de fios/tecido */}
      <g opacity="0.9">
        {/* Linhas horizontais */}
        <line x1="8" y1="15" x2="52" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="22" x2="52" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="29" x2="52" y2="29" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="36" x2="52" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="43" x2="52" y2="43" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="50" x2="52" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" />
        
        {/* Linhas verticais entrelaçadas */}
        <line x1="15" y1="8" x2="15" y2="52" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="30" y1="8" x2="30" y2="52" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="45" y1="8" x2="45" y2="52" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </g>
      
      {/* Letra F estilizada no centro */}
      <path
        d="M20 18 L20 42 M20 18 L35 18 M20 30 L30 30"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

