// La page serveur qui délègue à un composant client
import dynamic from 'next/dynamic'

// Import dynamique pour éviter les problèmes de résolution de module
const BlogPostEditor = dynamic(() => import('@/components/blog/BlogPostEditor'), {
  loading: () => <div className="flex justify-center items-center h-64">Loading editor...</div>
})

interface EditBlogPostPageProps {
    params: Promise<{id: string}>
}

// Utilisation du mot-clé async pour rendre la fonction compatible avec l'attente d'une Promise
export default async function EditBlogPostPage({params}: EditBlogPostPageProps) {
  const { id } = await params
  return <BlogPostEditor id={id} />
} 