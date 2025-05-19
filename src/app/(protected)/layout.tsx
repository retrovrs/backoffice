'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { MenuBar } from '@/components/MenuBar'

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = useSession()
  const isAuthenticated = !!session.data?.user
  const isLoading = session.isPending

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect('/signin')
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return null // This will be redirected in the useEffect
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