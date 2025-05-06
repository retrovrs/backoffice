'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { LogoHeader } from '@/components/LogoHeader'

export default function SigninPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn.email({
        email,
        password
      })
      router.push('/') // Redirection vers la page d'accueil après connexion
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <LogoHeader className="max-w-md" />

      <div className="bg-card text-card-foreground w-full max-w-md shadow-lg rounded-lg border p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
          Login
        </h1>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          You don't have an account?{' '}
          <a
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  )
} 