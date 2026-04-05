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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCardVisual } from '@/components/ui/credit-card-visual'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CreditCard as CreditCardType } from '@/lib/credit-card'
import { createClient } from '@/util/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  CheckCircle2,
  Circle,
  CreditCard as CreditCardIcon,
  KeyRound,
  Loader2,
  Lock,
  Moon,
  Palette,
  Plus,
  Shield,
  Sun,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import PulseLoader from 'react-spinners/PulseLoader'

// ── Perfil ───────────────────────────────

function ProfileSection({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(
    user.user_metadata?.full_name || ''
  )
  const [expenseTarget, setExpenseTarget] = useState(
    user.user_metadata?.expense_target?.toString() || ''
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)

  const email = user.email || ''

  async function handleSaveProfile() {
    setLoading(true)
    setMessage(null)

    const targetValue = expenseTarget ? Number(expenseTarget) : null
    const result = await updateProfile(displayName, targetValue)

    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    })
    setLoading(false)
    
    // Auto clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm overflow-hidden relative">
      {/* Background Icon */}
      <UserCircle2 className="absolute -right-8 -top-8 w-64 h-64 text-slate-50 dark:text-slate-800/20 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Dados do Perfil
        </h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            NOME DE EXIBIÇÃO
          </Label>
          <Input
            id="displayName"
            placeholder="Seu nome"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="h-14 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-bold text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            E-MAIL (NÃO EDITÁVEL)
          </Label>
          <div className="relative">
            <Input
              id="email"
              value={email}
              disabled
              className="h-14 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-bold text-slate-500 pr-12 opacity-80"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="expenseTarget" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            META DE GASTOS MENSAIS (OPCIONAL)
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
            <Input
              id="expenseTarget"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={expenseTarget}
              onChange={e => setExpenseTarget(e.target.value)}
              className="h-14 rounded-2xl bg-slate-100/50 dark:bg-slate-950/50 border-none pl-11 pr-4 font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm font-semibold rounded-2xl px-4 py-3 text-center ${message.type === 'success' ? 'text-teal-600 bg-teal-50 dark:bg-teal-500/10' : 'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>
            {message.text}
          </p>
        )}

        <Button
          onClick={handleSaveProfile}
          disabled={loading}
          className="h-14 px-8 rounded-2xl shadow-lg shadow-teal-500/30 text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <PulseLoader color="#fff" size={8} />
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Meus Cartões ──────────────────────────────

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
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setMessage(null)
      setIsModalOpen(false)
    }
    setSaving(false)
  }

  async function handleDeleteCard() {
    if (!deleteCardId) return
    const { error } = await supabase
      .from('credit_card')
      .delete()
      .eq('id', deleteCardId)

    if (!error) {
      setCards(prev => prev.filter(c => c.id !== deleteCardId))
    }
    setShowDeleteDialog(false)
    setDeleteCardId(null)
  }
  
  const resetForm = () => {
    setName('')
    setBank('')
    setLastDigits('')
    setBrand('')
    setDueDay('')
    setClosingDay('')
    setMessage(null)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Meus Cartões
        </h2>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-500 hover:text-blue-700 transition-colors">
              <CreditCardIcon className="w-4 h-4" />
              Adicionar Novo
            </button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md w-[95vw] rounded-[32px] overflow-hidden p-6 sm:p-8 border-none shadow-2xl dark:bg-slate-900">
             <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Novo Cartão
                </DialogTitle>
             </DialogHeader>
             
             <form onSubmit={handleAddCard} className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <Label htmlFor="cardName" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Nome do cartão</Label>
                   <Input
                     id="cardName"
                     placeholder="Ex: Nubank Pessoal"
                     value={name}
                     onChange={e => setName(e.target.value)}
                     required
                     className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label htmlFor="bank" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Banco</Label>
                   <Input
                     id="bank"
                     placeholder="Ex: Nubank"
                     value={bank}
                     onChange={e => setBank(e.target.value)}
                     required
                     className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label htmlFor="lastDigits" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Últimos 4 dígitos</Label>
                   <Input
                     id="lastDigits"
                     placeholder="0000"
                     maxLength={4}
                     value={lastDigits}
                     onChange={e =>
                       setLastDigits(e.target.value.replace(/\D/g, ''))
                     }
                     required
                     className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium tracking-widest"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label htmlFor="brand" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Bandeira</Label>
                   <Select onValueChange={setBrand} value={brand} required>
                     <SelectTrigger id="brand" className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium">
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
                 <div className="space-y-1.5">
                   <Label htmlFor="dueDay" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Dia do vencimento</Label>
                   <Input
                     id="dueDay"
                     type="number"
                     min={1}
                     max={31}
                     placeholder="Ex: 15"
                     value={dueDay}
                     onChange={e => setDueDay(e.target.value)}
                     required
                     className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <Label htmlFor="closingDay" className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Dia do fechamento</Label>
                   <Input
                     id="closingDay"
                     type="number"
                     min={1}
                     max={31}
                     placeholder="Ex: 8"
                     value={closingDay}
                     onChange={e => setClosingDay(e.target.value)}
                     required
                     className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 border-none px-4 font-medium"
                   />
                 </div>
               </div>
   
               {message && (
                 <p className={`text-sm font-semibold rounded-xl px-4 py-3 text-center ${message.type === 'success' ? 'text-teal-600 bg-teal-50 dark:bg-teal-500/10' : 'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>
                   {message.text}
                 </p>
               )}
   
               <div className="pt-2">
                 <Button
                   type="submit"
                   disabled={saving}
                   className="w-full h-14 bg-gradient-to-r from-teal-500 to-[#34d399] hover:from-teal-600 hover:to-teal-500 text-white rounded-2xl shadow-lg shadow-teal-500/30 text-base font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                   {saving ? (
                     <PulseLoader color="#fff" size={8} />
                   ) : (
                     'Adicionar Cartão'
                   )}
                 </Button>
               </div>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300 dark:text-slate-600" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory custom-scrollbar">
          {cards.map(card => (
            <div key={card.id} className="relative group snap-start shrink-0 w-[310px] sm:w-[340px]">
              <CreditCardVisual card={card} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 text-white hover:bg-red-600 rounded-full h-8 w-8 shadow-lg z-30"
                onClick={() => {
                  setDeleteCardId(card.id)
                  setShowDeleteDialog(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Botão de + Novo Cartão em formato de Card tracejado */}
          <button 
            type="button" 
            onClick={() => setIsModalOpen(true)}
            className="snap-start shrink-0 w-[310px] sm:w-[340px] outline-none"
          >
             <div className="h-full min-h-[220px] rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col items-center justify-center p-6 transition-colors bg-slate-50/50 dark:bg-slate-900/50 group">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <CreditCardIcon className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-600 dark:text-slate-400">Novo Cartão</p>
             </div>
          </button>
        </div>
      )}

      {/* AlertDialog for Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[32px] sm:max-w-sm">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
               <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500">
              Todos os gastos registrados neste cartão também serão excluídos. Essa ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 mt-4 sm:space-x-0">
            <AlertDialogCancel className="h-12 rounded-xl border-slate-200 font-bold m-0 w-full hover:bg-slate-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold m-0 w-full shadow-lg shadow-red-500/30"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Aparência ────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Palette },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
        Aparência
      </h2>
      <div className="space-y-3">
        {themes.map(t => {
          const Icon = t.icon
          const isActive = theme === t.value

          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  {t.label}
                </span>
              </div>
              {isActive ? (
                <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              ) : (
                <Circle className="h-6 w-6 text-slate-200 dark:text-slate-700" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Segurança & Zona de Perigo ────────────────────────────

function SecuritySection({ user }: { user: User }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const provider = user.app_metadata?.provider || 'email'
  const isOAuthUser = provider !== 'email'

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
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
      setTimeout(() => setShowPasswordDialog(false), 2000)
    }

    setLoading(false)
  }

  async function handleDeleteAccount() {
    await deleteAccount()
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
          Segurança
        </h2>
        
        {isOAuthUser ? (
          <p className="text-sm font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            Você está logado via <strong className="text-slate-900 dark:text-white capitalize">{provider}</strong>.<br />
            A alteração de senha não está disponível.
          </p>
        ) : (
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Alterar Senha
                  </span>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] rounded-[32px] border-none shadow-2xl dark:bg-slate-900">
              <DialogHeader className="mb-4">
                 <DialogTitle className="text-2xl font-bold">Alterar Senha</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">Senha atual</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">Nova senha</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo de 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">Confirmar nova senha</Label>
                  <Input
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium"
                  />
                </div>
                
                {message && (
                  <p className={`text-sm font-semibold rounded-xl px-4 py-3 text-center ${message.type === 'success' ? 'text-teal-600 bg-teal-50' : 'text-red-500 bg-red-50'}`}>
                    {message.text}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold mt-2"
                >
                  {loading ? <PulseLoader color="#fff" size={8} /> : 'Confirmar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="mt-10">
          <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest mb-3">
            ZONA DE PERIGO
          </p>
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-bold text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Minha Conta
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirmText(''); }}>
        <AlertDialogContent className="rounded-[32px] sm:max-w-sm">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
               <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground">
              Essa ação é irreversível. Todos os seus dados financeiros serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 mt-2">
            <Label className="text-xs font-bold text-muted-foreground ml-1">
              Digite <span className="text-red-500">CONFIRMAR</span> para prosseguir
            </Label>
            <Input
              type="text"
              placeholder=""
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 border-none px-4 font-medium text-center tracking-widest uppercase"
            />
          </div>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 mt-4 sm:space-x-0">
            <AlertDialogCancel className="h-12 rounded-xl border-muted font-bold m-0 w-full hover:bg-muted">Cancelar</AlertDialogCancel>
            <button
              type="button"
              onClick={() => { handleDeleteAccount(); setShowDeleteDialog(false); }}
              disabled={deleteConfirmText.toUpperCase() !== 'CONFIRMAR'}
              className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold m-0 w-full shadow-lg shadow-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500 transition-colors"
            >
              Sim, excluir
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
      <div className="flex h-[50vh] items-center justify-center">
        <PulseLoader color="#0ea5e9" size={10} />
      </div>
    )
  }

  if (!user) {
    return <p className="p-8 font-semibold text-center text-slate-500">Erro ao carregar os dados do usuário.</p>
  }

  return (
    <div className="container mx-auto py-1 px-4 max-w-6xl animate-in fade-in duration-500">
      
      {/* Top Config Header can be hidden or styled to match if needed, although the mock didn't have one explicitly. Let's omit it to have the panels at the top, or keep it subtle */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Configurações
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Gerencie seu perfil, segurança e preferências do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Coluna Esquerda */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <ProfileSection user={user} />
          <CreditCardSection userId={user.id} />
        </div>

        {/* Coluna Direita */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AppearanceSection />
          <SecuritySection user={user} />
        </div>

      </div>
    </div>
  )
}
