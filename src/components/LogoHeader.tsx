'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoHeaderProps {
  size?: number
  showText?: boolean
  className?: string
}

export function LogoHeader({ 
  size = 100, 
  showText = true,
  className = ''
}: LogoHeaderProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center py-8 ${className}`}>
      <Link href="/">
        <Image 
          src="/images/retrovrs.png" 
          alt="RetroVRS Logo" 
          width={size}
          height={size}
          priority
          className="transition-transform hover:scale-105"
        />
      </Link>
      {showText && (
        <h2 className="text-2xl font-bold mt-4 text-foreground">
          Backoffice
        </h2>
      )}
    </div>
  )
} 