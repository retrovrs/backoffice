'use client'

import { useEffect, useRef } from 'react'
import { redirect } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'

export default function BlogPostsLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { isAdmin, isEditor, isLoading, isAuthenticated } = useUserRole()
  const hasAccess = isAdmin || isEditor

  // Once access has been granted, keep rendering children even if a background
  // session/role refetch briefly flips isLoading — unmounting them would reset
  // every child page's state and re-trigger its data fetching.
  const hasBeenGrantedRef = useRef(false)
  if (!isLoading && isAuthenticated && hasAccess) {
    hasBeenGrantedRef.current = true
  }

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      redirect('/')
    }
  }, [hasAccess, isLoading])

  // Current authorization state always wins: never render children once access
  // is known to be lost, regardless of it having been granted before.
  if (!isLoading && (!isAuthenticated || !hasAccess)) {
    return null // This will be redirected in the useEffect
  }

  // Only the *initial* load shows the spinner. A background session/role
  // refetch keeps children mounted so their state survives a tab switch.
  if (isLoading && !hasBeenGrantedRef.current) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
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
