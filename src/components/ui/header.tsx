'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Menu, Bell, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { signOut } from '@/components/actions'
export function Header() {
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    setTheme('dark')
    document.documentElement.style.setProperty('--primary', '294 54 21')
  }, [setTheme])

  return (
    <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuItem>
            <Link href="#">Visão Geral</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="#">Adicionar Despesas</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="#">Adicionar Receitas</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="#">Configurações</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <nav className="flex-1">
        <ul className="hidden lg:flex gap-4">
          <li>
            <Link
              className="text-sm font-medium hover:underline hover:text-purple-400 underline-offset-4"
              href="/dashboard"
            >
              Visão Geral
            </Link>
          </li>
          <li>
            <Link
              className="text-sm font-medium hover:underline hover:text-purple-400 underline-offset-4"
              href="/despesas"
            >
              Adicionar Despesas
            </Link>
          </li>
          <li>
            <Link
              className="text-sm font-medium hover:underline hover:text-purple-400 underline-offset-4"
              href="/receita"
            >
              Adicionar Receitas
            </Link>
          </li>
          <li>
            <Link
              className="text-sm font-medium hover:underline hover:text-purple-400 underline-offset-4"
              href="#"
            >
              Configurações
            </Link>
          </li>
        </ul>
      </nav>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Alternar notificações</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Escuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => signOut()}>Sair</Button>
      </div>
    </header>
  )
}
