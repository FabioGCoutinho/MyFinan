'use client'

import {
  CreditCard,
  CreditCardIcon,
  LayoutDashboard,
  Menu,
  MinusCircle,
  PlusCircle,
  Settings,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from './button'

const navLinks = [
  {
    href: '/dashboard',
    label: 'Visão Geral',
    icon: LayoutDashboard,
  },
  {
    href: '/despesas',
    label: 'Adicionar Despesas',
    icon: MinusCircle,
  },
  {
    href: '/receita',
    label: 'Adicionar Receitas',
    icon: PlusCircle,
  },
  {
    href: '/cartao/novo',
    label: 'Gasto no Cartão',
    icon: CreditCard,
  },
  {
    href: '/cartao',
    label: 'Gastos no Cartão',
    icon: CreditCardIcon,
  },
  {
    href: '/config',
    label: 'Configurações',
    icon: Settings,
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface SidebarUserInfo {
  displayName: string
  email: string
  avatarUrl: string
}

interface SidebarProps {
  userInfo?: SidebarUserInfo | null
}

export function Sidebar({ userInfo }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const displayName = userInfo?.displayName || 'Usuário'
  const email = userInfo?.email || ''
  const avatarUrl = userInfo?.avatarUrl || ''

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-4 h-14 lg:h-[60px] border-b shrink-0">
        <span className="text-xl font-bold text-brand">MyFinan</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(link => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t px-4 py-4 shrink-0">
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground text-sm font-semibold">
              {getInitials(displayName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Alternar menu</span>
      </Button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          onKeyDown={() => {}}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:bg-background h-dvh sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}
