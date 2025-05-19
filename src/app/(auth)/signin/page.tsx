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
import { signInZodValidation } from './actions'

// Fonction pour vérifier si un email est dans la liste blanche
async function checkEmailInWhitelist(email: string) {
  try {
    const response = await fetch('/api/whitelist/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
    
    return response.json()
  } catch (error) {
    console.error('Error checking whitelist:', error)
    return { isWhitelisted: false, error: 'Erreur lors de la vérification de la liste blanche' }
  }
}

export default function SigninPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    let email = formData.get('email')?.toString() || ''
    const password = formData.get('password')?.toString() || ''

    const responseZodValidation = await signInZodValidation(formData)
    if (responseZodValidation.success) {
      email = responseZodValidation.email as string
    } else {
      setError(responseZodValidation.msgError as string)
      return
    }

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)

      // Check if the email is in the whitelist
      const whitelistCheck = await checkEmailInWhitelist(email)
      
      console.log("whitelistCheck", whitelistCheck)
      if (!whitelistCheck.isWhitelisted) {
        setLoading(false)
        const errorMessage = whitelistCheck.message || 'You are not authorized to use this application. Please contact an administrator.'
        toast.error(errorMessage)
        setError(errorMessage)
        return
      }

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
      const errorMessage = err?.message || 'An error occurred during connection'
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
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
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
            {loading ? 'Connection in progress...' : 'Sign in to the Backoffice'}
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