'use client'

import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function Home() {
    const { data } = useSession()
    const sessionData = data?.session
    const isAuthenticated = !!sessionData
    const [userName, setUserName] = useState('Utilisateur')
    const [draftPostsCount, setDraftPostsCount] = useState(0)
    const [publishedPostsCount, setPublishedPostsCount] = useState(0)
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)

    // Récupération du nom d'utilisateur à partir de son userId
    useEffect(() => {
      async function fetchUserName() {
        if (sessionData?.userId) {
          try {
            const response = await fetch(`/api/users/${sessionData.userId}`)
            if (response.ok) {
              const userData = await response.json()
              setUserName(userData.name || 'Utilisateur')
            }
          } catch (error) {
            console.error('Error when loading the user name:', error)
          }
        }
      }

      if (isAuthenticated) {
        fetchUserName()
      }
    }, [sessionData, isAuthenticated])
    
    // Récupération des métriques des blog posts
    useEffect(() => {
      async function fetchBlogMetrics() {
        if (isAuthenticated) {
          setIsLoadingMetrics(true)
          try {
            const response = await fetch('/api/blog-metrics')
            if (response.ok) {
              const metrics = await response.json()
              setDraftPostsCount(metrics.draftCount || 0)
              setPublishedPostsCount(metrics.publishedCount || 0)
            }
          } catch (error) {
            console.error('Error when loading the metrics:', error)
          } finally {
            setIsLoadingMetrics(false)
          }
        }
      }

      if (isAuthenticated) {
        fetchBlogMetrics()
      }
    }, [isAuthenticated])

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
                Welcome, {userName}
              </p>
              
              <div className="flex justify-center mt-6">
                <Link href="/blog-posts" className="block w-full max-w-sm">
                  <div className="group h-full rounded-md border p-6 shadow-sm transition-all hover:shadow-md hover:border-primary">
                    <h3 className="text-xl font-semibold mb-2">Blog Posts</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Manage your blog posts and track their performance
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                        {isLoadingMetrics ? '...' : `${draftPostsCount} DRAFT`}
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        {isLoadingMetrics ? '...' : `${publishedPostsCount} PUBLISHED`}
                      </div>
                    </div>
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