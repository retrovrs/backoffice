'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoHeader } from '@/components/LogoHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

export default function SigninPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')?.toString() || ''
    const password = formData.get('password')?.toString() || ''

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      const response = await signIn.email({
        email,
        password,
      })

      setLoading(false)
      console.log("response", response)
      if (response.error) {
        console.log("CONNECTION ERROR", response)
        const errorMessage = response.error?.message || 'Connection failed'
        toast.error(errorMessage)
        setError(errorMessage)
      } else {
        console.log("CONNECTION SUCCESS", response)
        toast.success('You are connected !')
        router.push('/')
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'An Error Occured during connection'
      toast.error(errorMessage)
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <LogoHeader className="max-w-md" />

      <div className="bg-card text-card-foreground w-full max-w-md shadow-lg rounded-lg border p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
          Connexion
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="votre@email.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect to Backoffice'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          You don't have an account ?{' '}
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