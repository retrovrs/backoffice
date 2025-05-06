'use client'

import { MenuBar } from '@/components/MenuBar'
import Image from 'next/image'
import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center p-2 lg:p-4 border-b">
        <Link href="/">
          <Image 
            src="/images/retrovrs.png" 
            alt="RetroVRS Logo" 
            width={60} 
            height={60} 
            className="cursor-pointer" 
          />
        </Link>
      </div>
      <MenuBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 