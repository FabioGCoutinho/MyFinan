'use client'

import {
  deleteAccount,
  updatePassword,
  updateProfile,
} from '@/components/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/ui/header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  Check,
  Loader2,
  Moon,
  Palette,
  Shield,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

// ── Componente de Perfil ───────────────────────────────

function ProfileSection({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(
    user.user_metadata?.full_name || ''
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  const email = user.email || ''
  const provider = user.app_metadata?.provider || 'email'

  async function handleSaveProfile() {
    setLoading(true)
    setMessage(null)

    const result = await updateProfile(displayName)

    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    })
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Informações do Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" value={email} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">
            O e-mail não pode ser alterado.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Nome</Label>
          <Input
            id="displayName"
            placeholder="Seu nome"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Provedor de login</Label>
          <Input
            value={provider === 'google' ? 'Google' : 'E-mail / Senha'}
            disabled
            className="opacity-60"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
          >
            {message.text}
          </p>
        )}

        <Button
          onClick={handleSaveProfile}
          disabled={loading}
          className="bg-button text-button-foreground hover:bg-purple-900"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Componente de Segurança ────────────────────────────

function SecuritySection({ user }: { user: User }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const provider = user.app_metadata?.provider || 'email'
  const isOAuthUser = provider !== 'email'

  async function handleChangePassword() {
    setMessage(null)

    if (newPassword.length < 6) {
      setMessage({
        text: 'A nova senha deve ter pelo menos 6 caracteres.',
        type: 'error',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' })
      return
    }

    setLoading(true)
    const result = await updatePassword(currentPassword, newPassword)

    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    })

    if (result.success) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setLoading(false)
  }

  async function handleDeleteAccount() {
    await deleteAccount()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOAuthUser ? (
            <p className="text-sm text-muted-foreground">
              Você está logado via{' '}
              <strong>{provider === 'google' ? 'Google' : provider}</strong>. A
              alteração de senha não está disponível para contas OAuth.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {message && (
                <p
                  className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {message.text}
                </p>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="bg-button text-button-foreground hover:bg-purple-900"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Shield className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ao excluir sua conta, todos os seus dados financeiros (receitas e
            despesas) serão permanentemente removidos. Essa ação não pode ser
            desfeita.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. Todos os seus dados financeiros serão
              excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, excluir minha conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Componente de Aparência ────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    {
      value: 'light',
      label: 'Claro',
      icon: Sun,
      description: 'Tema com fundo branco e texto escuro.',
    },
    {
      value: 'dark',
      label: 'Escuro',
      icon: Moon,
      description: 'Tema com fundo escuro e texto claro.',
    },
    {
      value: 'system',
      label: 'Sistema',
      icon: Palette,
      description: 'Segue a preferência do seu dispositivo.',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {themes.map(t => {
            const Icon = t.icon
            const isActive = theme === t.value

            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                  isActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <Icon
                  className={`h-8 w-8 ${isActive ? 'text-purple-400' : 'text-muted-foreground'}`}
                />
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${isActive ? 'text-purple-400' : ''}`}
                  >
                    {t.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.description}
                  </p>
                </div>
                {isActive && <Check className="h-4 w-4 text-purple-400" />}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Página Principal ───────────────────────────────────

export default function ConfigPage() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-dvh">
        <Header />
        <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center min-h-dvh">
        <Header />
        <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
          <p>Erro ao carregar dados do usuário</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-dvh">
      <Header />
      <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
        <div className="w-full space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie seu perfil, segurança e preferências.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <ProfileSection user={user} />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecuritySection user={user} />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <AppearanceSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
