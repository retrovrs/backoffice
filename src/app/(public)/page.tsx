'use client'

import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'

  return (
    <div className="flex flex-col items-center p-8 bg-background">
      <div className="bg-card text-card-foreground w-full max-w-lg shadow-lg rounded-lg border mt-10">
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
                Bienvenue, {session?.user?.name || 'Utilisateur'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Link href="/blog-posts" className="block">
                  <div className="group h-full rounded-md border p-6 shadow-sm transition-all hover:shadow-md hover:border-primary">
                    <h3 className="text-xl font-semibold mb-2">Blog Posts</h3>
                    <p className="text-muted-foreground text-sm">
                      Manage your blog posts and track their performance
                    </p>
                  </div>
                </Link>
                
                <Link href="/educational-posts" className="block">
                  <div className="group h-full rounded-md border p-6 shadow-sm transition-all hover:shadow-md hover:border-primary">
                    <h3 className="text-xl font-semibold mb-2">Educational Posts</h3>
                    <p className="text-muted-foreground text-sm">
                      Create and organize your educational content
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 