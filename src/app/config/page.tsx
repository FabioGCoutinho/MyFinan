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
import { CreditCardVisual } from '@/components/ui/credit-card-visual'
import { Header } from '@/components/ui/header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CreditCard as CreditCardType } from '@/lib/credit-card'
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  Check,
  CreditCard as CreditCardIcon,
  Loader2,
  Moon,
  Palette,
  Shield,
  Sun,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

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
            className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-danger'}`}
          >
            {message.text}
          </p>
        )}

        <Button
          onClick={handleSaveProfile}
          disabled={loading}
          className="bg-button text-button-foreground hover:bg-brand/80"
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
                  className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-danger'}`}
                >
                  {message.text}
                </p>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="bg-button text-button-foreground hover:bg-brand/80"
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
          <CardTitle className="flex items-center gap-2 text-danger">
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

// ── Componente de Cartões ──────────────────────────────

function CreditCardSection({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [cards, setCards] = useState<CreditCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteCardId, setDeleteCardId] = useState<number | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [lastDigits, setLastDigits] = useState('')
  const [brand, setBrand] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [closingDay, setClosingDay] = useState('')

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase
        .from('credit_card')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setCards(data ?? [])
      setLoading(false)
    }
    fetchCards()
  }, [supabase, userId])

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const dueDayNum = Number(dueDay)
    const closingDayNum = Number(closingDay)

    if (
      dueDayNum < 1 ||
      dueDayNum > 31 ||
      closingDayNum < 1 ||
      closingDayNum > 31
    ) {
      setMessage({ text: 'Dia deve ser entre 1 e 31.', type: 'error' })
      setSaving(false)
      return
    }

    if (lastDigits.length !== 4 || !/^\d{4}$/.test(lastDigits)) {
      setMessage({
        text: 'Informe os 4 últimos dígitos do cartão.',
        type: 'error',
      })
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('credit_card')
      .insert({
        user_id: userId,
        name,
        bank,
        last_digits: lastDigits,
        brand,
        due_day: dueDayNum,
        closing_day: closingDayNum,
      })
      .select()
      .single()

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setCards(prev => [data, ...prev])
      setName('')
      setBank('')
      setLastDigits('')
      setBrand('')
      setDueDay('')
      setClosingDay('')
      setMessage({ text: 'Cartão cadastrado com sucesso!', type: 'success' })
    }
    setSaving(false)
  }

  async function handleDeleteCard() {
    if (!deleteCardId) return
    const { error } = await supabase
      .from('credit_card')
      .delete()
      .eq('id', deleteCardId)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setCards(prev => prev.filter(c => c.id !== deleteCardId))
      setMessage({ text: 'Cartão excluído com sucesso.', type: 'success' })
    }
    setShowDeleteDialog(false)
    setDeleteCardId(null)
  }

  const brandLabels: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    elo: 'Elo',
    amex: 'American Express',
    hipercard: 'Hipercard',
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Cadastrar Cartão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCard} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Nome do cartão</Label>
                <Input
                  id="cardName"
                  placeholder="Ex: Nubank Pessoal"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Banco</Label>
                <Input
                  id="bank"
                  placeholder="Ex: Nubank"
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastDigits">Últimos 4 dígitos</Label>
                <Input
                  id="lastDigits"
                  placeholder="0000"
                  maxLength={4}
                  value={lastDigits}
                  onChange={e =>
                    setLastDigits(e.target.value.replace(/\D/g, ''))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Bandeira</Label>
                <Select onValueChange={setBrand} value={brand} required>
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="elo">Elo</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="hipercard">Hipercard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia do vencimento</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Ex: 15"
                  value={dueDay}
                  onChange={e => setDueDay(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingDay">Dia do fechamento</Label>
                <Input
                  id="closingDay"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="Ex: 8"
                  value={closingDay}
                  onChange={e => setClosingDay(e.target.value)}
                  required
                />
              </div>
            </div>

            {message && (
              <p
                className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-danger'}`}
              >
                {message.text}
              </p>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="bg-button text-button-foreground hover:bg-brand/80"
            >
              {saving ? (
                <PulseLoader color="#fff" size={8} />
              ) : (
                'Cadastrar Cartão'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de cartões */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 justify-items-center">
          {cards.map(card => (
            <div
              key={card.id}
              className="relative group w-full flex flex-col items-center"
            >
              <CreditCardVisual card={card} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-danger text-danger-foreground hover:bg-danger/90 rounded-full h-8 w-8 shadow-lg z-30"
                onClick={() => {
                  setDeleteCardId(card.id)
                  setShowDeleteDialog(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCardIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum cartão cadastrado ainda.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os gastos registrados neste cartão também serão excluídos.
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
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
                    ? 'border-brand bg-brand/10'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <Icon
                  className={`h-8 w-8 ${isActive ? 'text-brand' : 'text-muted-foreground'}`}
                />
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${isActive ? 'text-brand' : ''}`}
                  >
                    {t.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.description}
                  </p>
                </div>
                {isActive && <Check className="h-4 w-4 text-brand" />}
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
            <TabsTrigger value="cards">Cartões</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <ProfileSection user={user} />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecuritySection user={user} />
          </TabsContent>

          <TabsContent value="cards" className="space-y-4">
            <CreditCardSection userId={user.id} />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <AppearanceSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
