'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
}

export function CompanyLogo({ className = '', size = 60 }: LogoProps) {
  return (
    <Image
      src="/images/EDSERP.svg"
      alt="EDS Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}

