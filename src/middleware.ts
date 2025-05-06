import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Récupérer l'utilisateur depuis le localStorage côté client
    // Ce code est simplifié pour la démonstration, car dans un vrai middleware
    // nous utiliserions des cookies et JWT pour vérifier l'authentification

    // Pour les chemins protégés, vérifier l'authentification
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

    if (isProtectedRoute) {
        // Dans un cas réel, vous vérifieriez un cookie JWT ici
        // Pour la démo, nous redirigeons toujours vers la connexion pour les routes protégées
        return NextResponse.redirect(new URL('/signin', request.url))
    }

    return NextResponse.next()
}

export const config = {
    // Définir les chemins qui déclenchent le middleware
    matcher: ['/dashboard/:path*']
} 