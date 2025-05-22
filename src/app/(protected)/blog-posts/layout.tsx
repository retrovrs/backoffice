'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'

export default function BlogPostsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { isAdmin, isEditor, isLoading, isAuthenticated } = useUserRole()
  const hasAccess = isAdmin || isEditor

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      redirect('/')
    }
  }, [hasAccess, isLoading])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated || !hasAccess) {
    return null // This will be redirected in the useEffect
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 font-medium">
            This section is accessible to administrators and editors
          </p>
        </div>
      )}
      {children}
    </div>
  )
} 