'use client'

import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoHeader } from '@/components/LogoHeader'

export default function Home() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <LogoHeader size={120} className="max-w-lg" />

      <div className="bg-card text-card-foreground w-full max-w-lg shadow-lg rounded-lg border">
        <div className="p-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Welcome to Retro//Vrs Backoffice
          </h1>

          {!isAuthenticated && (
            <div className="flex flex-col gap-4 mt-8">
              <p className="text-muted-foreground mb-4">
                Connect to your space
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="default">
                  <Link href="/signin">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-8">
              <p className="text-muted-foreground mb-4">
                Welcome, {session?.user?.name || 'User'}
              </p>
              <Button>
                Access your space
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 