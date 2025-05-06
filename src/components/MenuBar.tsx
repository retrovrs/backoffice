'use client'

import Image from 'next/image'
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
  return (
    <Menubar className="rounded-none border-b border-none px-2 lg:px-4 flex items-center">
      <div className="flex items-center mr-4">
        <Image 
          src="/images/retrovrs.png" 
          alt="RetroVRS Logo" 
          width={100} 
          height={100} 
        />
      </div>
      <MenubarMenu>
        <MenubarTrigger className="font-bold">RetroVRS</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>About</MenubarItem>
          <MenubarItem>Login</MenubarItem>
          <MenubarItem>Signup</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>SEO Articles</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Blog Posts</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Eductional Posts</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      
    </Menubar>
  )
} 