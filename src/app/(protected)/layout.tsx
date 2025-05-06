'use client'

import { useSession } from '@/lib/auth-client'
import { redirect } from 'next/navigation'
import { MenuBar } from '@/components/MenuBar'

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
    const { data } = useSession()
    const sessionData = data?.session
    const isAuthenticated = !!sessionData;

  if (status === 'loading') {
    return <div>Chargement...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/signin')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MenuBar />
      <main className="flex-1 container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  )
} 