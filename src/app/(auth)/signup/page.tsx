'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoHeader } from '@/components/LogoHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'
import { SignupFormState, validateSignupForm } from './actions'

const initialState: SignupFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
    >
      {pending ? 'Account creation...' : 'Sign up'}
    </Button>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(validateSignupForm, initialState)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  // Appeler better-auth quand les données sont validées côté serveur
  useEffect(() => {
    const handleBetterAuthSignup = async () => {
      if (state.success && state.isWhitelisted && state.validatedData && !registered) {
        const { name, email, password } = state.validatedData

        try {
          await signUp.email({
            email,
            password,
            name,
            fetchOptions: {
              onRequest: () => {
                setLoading(true)
              },
              onResponse: () => {
                setLoading(false)
              },
              onError: (ctx) => {
                toast.error(ctx.error.message || 'Error during Signup')
                setLoading(false)
              },
              onSuccess: () => {
                setRegistered(true)
                toast.success('Your account has been created successfully')
                setLoading(false)
              }
            }
          })
        } catch (error) {
          console.error('Error during Signup:', error)
          toast.error('An error occurred during the registration process')
          setLoading(false)
        }
      }
    }

    handleBetterAuthSignup()
  }, [state, registered])

  // Rediriger vers la page d'accueil après inscription réussie
  useEffect(() => {
    if (registered) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [registered, router])

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <LogoHeader className="max-w-md" />

      <div className="bg-card text-card-foreground w-full max-w-md shadow-lg rounded-lg border p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
          Create an account
        </h1>

        {state.errors?._form && (
          <Alert variant="destructive" className="mb-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              {state.errors._form[0]}
            </AlertDescription>
          </Alert>
        )}

        {registered && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircledIcon className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Account created successfully ! You will be redirected to the home page.
            </AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              className={`w-full ${state.errors?.name ? 'border-destructive' : ''}`}
              disabled={loading || registered}
            />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

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
              className={`w-full ${state.errors?.email ? 'border-destructive' : ''}`}
              disabled={loading || registered}
            />
            {state.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email[0]}</p>
            )}
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
              className={`w-full ${state.errors?.password ? 'border-destructive' : ''}`}
              disabled={loading || registered}
            />
            {state.errors?.password && (
              <p className="text-sm text-destructive">{state.errors.password[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || registered}
          >
            {loading ? 'Registration in progress...' : (registered ? 'Registered !' : 'Sign up')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          You already have an account ?{' '}
          <a
            href="/signin"
            className="text-primary font-medium hover:underline"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  )
} 