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
      <MenuBar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 