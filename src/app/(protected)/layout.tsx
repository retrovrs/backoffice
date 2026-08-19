'use client'

import { useEffect, useRef } from 'react'
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

  // better-auth refetches the session on window focus. Once authenticated, keep
  // children mounted across those refetches so their state survives a tab switch.
  const hasBeenAuthenticatedRef = useRef(false)
  if (!isLoading && isAuthenticated) {
    hasBeenAuthenticatedRef.current = true
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect('/signin')
    }
  }, [isAuthenticated, isLoading])

  // Current authorization state always wins: never render children once access
  // is known to be lost, regardless of it having been granted before.
  if (!isLoading && !isAuthenticated) {
    return null // This will be redirected in the useEffect
  }

  // Only the *initial* load shows the spinner. A background session refetch
  // keeps children mounted so their state survives a tab switch.
  if (isLoading && !hasBeenAuthenticatedRef.current) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
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
