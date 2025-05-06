'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger
} from '@/components/ui/menubar'

export function MenuBar() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const router = useRouter()

  // Ne pas rendre le menu si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null
  }

  return (
    <Menubar className="rounded-none border-b border-none px-2 lg:px-4 flex items-center">
      <div className="flex items-center mr-4">
        <Image 
          src="/images/retrovrs.png" 
          alt="RetroVRS Logo" 
          width={80} 
          height={80} 
        />
      </div>
      <MenubarMenu>
        <MenubarTrigger className="font-bold">RetroVRS</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>About</MenubarItem>
          <MenubarItem onClick={() => router.push('/')}>Dashboard</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>My Profil</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>SEO Posts</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => router.push('/blog-posts')}>Blog Posts</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Eductional Posts</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
} 