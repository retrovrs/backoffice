import dynamic from 'next/dynamic'

// Import dynamique pour éviter les problèmes de résolution de module
const BlogPostEditorProtected = dynamic(() => import('@/components/blog/BlogPostEditorProtected'), {
  loading: () => <div className="flex justify-center items-center h-64">Loading editor ...</div>
})

interface EditBlogPostPageProps {
  params: Promise<{id: string}>
}

export default async function EditBlogPostPage({ 
  params 
}: EditBlogPostPageProps) {
  const { id } = await params
  return <BlogPostEditorProtected id={id} />
} 