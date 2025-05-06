'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { signIn, type SigninFormState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoHeader } from '@/components/LogoHeader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons'
import { useEffect } from 'react'

const initialState: SigninFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
    >
      {pending ? 'Connecting...' : 'Login'}
    </Button>
  )
}

export default function SigninPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, initialState)

  // Rediriger vers la page d'accueil en cas de succès
  useEffect(() => {
    if (state.success) {
      // Stocker les informations de session (dans un projet réel, utilisez un gestionnaire d'auth approprié)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({
          id: state.userId,
          name: state.userName,
          email: ''  // L'email n'est pas retourné pour des raisons de sécurité
        }))
      }
      router.push('/')
    }
  }, [state.success, router, state.userId, state.userName])

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <LogoHeader className="max-w-md" />

      <div className="bg-card text-card-foreground w-full max-w-md shadow-lg rounded-lg border p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-center">
          Login
        </h1>

        {state.errors?._form && (
          <Alert variant="destructive" className="mb-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              {state.errors._form[0]}
            </AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
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
              className={`w-full ${state.errors?.email ? 'border-destructive' : ''}`}
            />
            {state.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email[0]}</p>
            )}
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
              className={`w-full ${state.errors?.password ? 'border-destructive' : ''}`}
            />
            {state.errors?.password && (
              <p className="text-sm text-destructive">{state.errors.password[0]}</p>
            )}
          </div>

          <SubmitButton />
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