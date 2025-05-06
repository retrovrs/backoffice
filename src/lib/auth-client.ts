// Simulation d'authentification côté client pour démo
// Dans un projet réel, utilisez NextAuth.js ou un autre système d'authentification

// Type pour les données utilisateur
export type User = {
    id: string;
    email: string;
    name: string;
};

// Type pour la session
export type Session = {
    user: User | null;
    expires: string;
};

// Fonction pour s'inscrire
export const signUpEmail = async (email: string, password: string, name: string): Promise<User> => {
    // Simuler une requête API
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Vérifier si l'email est valide
                if (!email.includes('@')) {
                    throw new Error('Email invalide');
                }

                // Vérifier si le mot de passe est suffisamment long
                if (password.length < 8) {
                    throw new Error('Le mot de passe doit contenir au moins 8 caractères');
                }

                // Simuler la création d'un utilisateur
                const user = {
                    id: Math.random().toString(36).substring(2, 15),
                    email,
                    name: name || email.split('@')[0]
                };

                // Stocker l'utilisateur dans localStorage (uniquement pour la démo)
                localStorage.setItem('user', JSON.stringify(user));

                resolve(user);
            } catch (error) {
                reject(error);
            }
        }, 500); // Délai pour simuler une requête réseau
    });
};

// Objet signIn avec méthodes pour se connecter
export const signIn = {
    // Connexion par email et mot de passe
    email: async ({ email, password }: { email: string; password: string }): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // Dans un cas réel, vérifiez les identifiants avec votre backend
                    const user = {
                        id: Math.random().toString(36).substring(2, 15),
                        email,
                        name: email.split('@')[0]
                    };

                    // Stocker l'utilisateur dans localStorage (uniquement pour la démo)
                    localStorage.setItem('user', JSON.stringify(user));

                    resolve(user);
                } catch (error) {
                    reject(error);
                }
            }, 500);
        });
    },

    // Connexion via réseau social (exemple)
    social: async ({ provider }: { provider: string }): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    // Simuler une redirection vers le fournisseur d'authentification sociale
                    console.log(`Redirection vers ${provider} pour authentification...`);

                    // Simuler un utilisateur connecté via réseau social
                    const user = {
                        id: Math.random().toString(36).substring(2, 15),
                        email: `user@${provider}.com`,
                        name: `Utilisateur ${provider}`
                    };

                    localStorage.setItem('user', JSON.stringify(user));

                    resolve(user);
                } catch (error) {
                    reject(error);
                }
            }, 500);
        });
    }
};

// Fonction pour se déconnecter
export const signOut = async (): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            localStorage.removeItem('user');
            resolve();
        }, 300);
    });
};

// Hook personnalisé pour accéder à la session
export const useSession = (): { data: Session | null; status: 'loading' | 'authenticated' | 'unauthenticated' } => {
    // Dans un composant réel, ceci serait un hook React qui utilise useState et useEffect
    // Pour cette démo, nous simulons simplement le retour
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!userStr) {
        return {
            data: null,
            status: 'unauthenticated'
        };
    }

    return {
        data: {
            user: JSON.parse(userStr),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // expire dans 24h
        },
        status: 'authenticated'
    };
}; 