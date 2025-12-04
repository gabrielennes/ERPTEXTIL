'use client'

import { useState } from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export function CompanyLogo({ className = '', size = 60 }: LogoProps) {
  const [imgSrc, setImgSrc] = useState('/images/EDSERP.svg')
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    // Fallback para JPG caso o SVG não carregue
    if (!hasError) {
      setHasError(true)
      setImgSrc('/images/EDSERP.jpg')
    }
  }

  return (
    <img
      src={imgSrc}
      alt="EDS Logo"
      width={size}
      height={size}
      className={className}
      style={{ 
        objectFit: 'contain',
        display: 'block',
        maxWidth: '100%',
        height: 'auto'
      }}
      loading="eager"
      onError={handleError}
      onLoad={() => {
        // Garantir que a imagem foi carregada corretamente
        setHasError(false)
      }}
    />
  )
}

