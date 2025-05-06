'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { MenuBar } from '@/components/MenuBar'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { isAdmin, isLoading, isAuthenticated } = useUserRole()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      redirect('/')
    }
  }, [isAdmin, isLoading])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated || !isAdmin) {
    return null // This will be redirected in the useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MenuBar />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 font-medium">
            Admin area - Only administrators have access to this section
          </p>
        </div>
        {children}
      </main>
    </div>
  )
} 