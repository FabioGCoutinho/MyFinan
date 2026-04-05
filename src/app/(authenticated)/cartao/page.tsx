'use client'

import { revalidateAfterCardAction } from '@/components/actions'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import type { CreditCard, CreditCardExpense } from '@/lib/credit-card'
import { getInvoicePeriodByDueMonth } from '@/lib/credit-card'
import { createClient } from '@/util/supabase/client'
import { parseLocalDate } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import { addMonths, format, startOfMonth, subMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  CreditCard as CreditCardIcon,
  Trash2,
  Filter,
  Download,
  TrendingDown,
  TrendingUp,
  Clock,
  ShoppingBag,
  Utensils,
  Plane,
  Car,
  PlusCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ExpenseIcon = ({ category }: { category: string }) => {
  switch (category.toUpperCase()) {
    case 'E-COMMERCE': return <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    case 'LAZER': return <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    case 'VIAGEM': return <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    case 'TRANSPORTE': return <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    default: return <CreditCardIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
  }
}

const ExpenseIconBg = ({ category }: { category: string }) => {
  switch (category.toUpperCase()) {
    case 'E-COMMERCE': return 'bg-indigo-100 dark:bg-indigo-900/30'
    case 'LAZER': return 'bg-orange-100 dark:bg-orange-900/30'
    case 'VIAGEM': return 'bg-blue-100 dark:bg-blue-900/30'
    case 'TRANSPORTE': return 'bg-emerald-100 dark:bg-emerald-900/30'
    default: return 'bg-teal-100 dark:bg-teal-900/30'
  }
}

const getCardDotColor = (index: number) => {
  const colors = ['bg-emerald-500', 'bg-blue-600', 'bg-indigo-500', 'bg-orange-500', 'bg-rose-500']
  return colors[index % colors.length]
}

// ── Página ─────────────────────────────────────────────

export default function CartaoPage() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [expenses, setExpenses] = useState<CreditCardExpense[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('all')
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const [alertShow, setAlertShow] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const isMobile = useIsMobile()

  useEffect(() => {
    setCurrentPage(1)
  }, [date, selectedCardId])

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return

      const [cardsRes, expensesRes] = await Promise.all([
        supabase.from('credit_card').select('*').eq('user_id', user.id),
        supabase.from('credit_card_expense').select('*').eq('user_id', user.id),
      ])

      setCards(cardsRes.data ?? [])
      setExpenses(expensesRes.data ?? [])
      setLoading(false)
    }
    init()
  }, [supabase])

  // ── Cartões ──────────────────────────────────────────

  const getCardNameShort = (cardId: number) => {
    const card = cards.find(c => c.id === cardId)
    return card ? `${card.name} • ${card.last_digits}` : ''
  }

  // ── Janelas e Cálculos ───────────────────────────────
  
  const monthsList = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const d = addMonths(date, i - 2)
      return {
        date: startOfMonth(d),
        label: format(d, 'MMM', { locale: ptBR }),
      }
    })
  }, [date])

  const filteredExpenses = useMemo(() => {
    const targetCards =
      selectedCardId === 'all'
        ? cards
        : cards.filter(c => c.id === Number(selectedCardId))

    if (targetCards.length === 0) return []

    const month = date.getMonth()
    const year = date.getFullYear()

    return expenses
      .filter(exp => {
        const card = targetCards.find(c => c.id === exp.card_id)
        if (!card) return false
        const { start, end } = getInvoicePeriodByDueMonth(
          year,
          month,
          card.closing_day,
          card.due_day
        )
        const expDate = parseLocalDate(exp.created_at)
        return expDate >= start && expDate <= end
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }, [expenses, cards, selectedCardId, date])

  const totalFormatted = filteredExpenses.reduce((sum, e) => sum + Number(e.value), 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  // Trend previous total
  const percentageChange = useMemo(() => {
    const previousMonth = subMonths(date, 1)
    const targetCards = selectedCardId === 'all' ? cards : cards.filter(c => c.id === Number(selectedCardId))
    
    if (targetCards.length === 0) return 0
    
    const previousExpenses = expenses.filter(exp => {
      const card = targetCards.find(c => c.id === exp.card_id)
      if (!card) return false
      const { start, end } = getInvoicePeriodByDueMonth(
        previousMonth.getFullYear(),
        previousMonth.getMonth(),
        card.closing_day,
        card.due_day
      )
      const expDate = parseLocalDate(exp.created_at)
      return expDate >= start && expDate <= end
    })
    
    const prevTotal = previousExpenses.reduce((sum, e) => sum + Number(e.value), 0)
    const currentTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.value), 0)
    
    if (prevTotal === 0) return currentTotal > 0 ? 100 : 0
    return ((currentTotal - prevTotal) / prevTotal) * 100
  }, [date, selectedCardId, cards, expenses, filteredExpenses])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (cards.length === 0) return null

    const targetCards = selectedCardId === 'all' ? cards : cards.filter(c => c.id === Number(selectedCardId))
    if (targetCards.length === 0) return null

    const items = targetCards.map(card => {
      const { start, end } = getInvoicePeriodByDueMonth(
        date.getFullYear(),
        date.getMonth(),
        card.closing_day,
        card.due_day
      )
      const closingStr = format(end, 'dd MMM', { locale: ptBR })

      const due = new Date(date.getFullYear(), date.getMonth(), card.due_day)
      const dueStr = format(due, 'dd MMM', { locale: ptBR })

      const totalCycleTime = end.getTime() - start.getTime()
      const elapsed = new Date().getTime() - start.getTime()
      let cyclePercentage = Math.max(0, Math.min(100, Math.round((elapsed / totalCycleTime) * 100)))
      if (new Date() > end) cyclePercentage = 100
      if (new Date() < start) cyclePercentage = 0

      let daysToDue = Math.ceil((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const isOverdue = daysToDue < 0
      daysToDue = Math.abs(daysToDue)

      return {
        cardName: card.name,
        lastDigits: card.last_digits,
        closingStr,
        dueStr,
        cyclePercentage,
        daysToDue,
        isOverdue,
      }
    })

    const isSingle = items.length === 1
    return {
      isSingle,
      items,
      ...(items[0] || {}),
    } as {
      isSingle: boolean;
      items: typeof items;
      cardName?: string;
      lastDigits?: string;
      closingStr?: string;
      dueStr?: string;
      cyclePercentage?: number;
      daysToDue?: number;
      isOverdue?: boolean;
    }
  }, [cards, selectedCardId, date])

  // Pagination Logic
  const itemsPerPage = isMobile ? 10 : 15
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage))
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ── Exclusão ─────────────────────────────────────────

  const handleDeleteConfirm = (id: number) => {
    setSelectedId(id)
    setAlertShow(true)
  }

  const handleDelete = async () => {
    if (!selectedId) return
    await supabase.from('credit_card_expense').delete().eq('id', selectedId)
    setExpenses(prev => prev.filter(e => e.id !== selectedId))
    setAlertShow(false)
    await revalidateAfterCardAction()
  }

  // ── Renderização ─────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col xl:w-3/4 w-full mx-auto pb-10">
      
      {cards.length === 0 ? (
        <div className="mt-8">
          <div className="bg-surface border border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <CreditCardIcon className="h-16 w-16 text-muted-foreground mb-6 opacity-40" />
            <h3 className="text-xl font-bold mb-2">Nenhum cartão cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Cadastre um cartão de crédito nas Configurações para começar a gerenciar seus gastos de fatura.
            </p>
            <Button asChild className="px-6 rounded-full font-semibold">
              <Link href="/config">Ir para Configurações</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Controles Superiores ────────────────────────────── */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 my-8">
            <div className="space-y-3 w-full lg:w-auto">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Período de Referência
              </label>
              <div className="flex bg-surface border border-border rounded-full p-1.5 w-full lg:w-auto overflow-x-auto gap-1 shadow-sm">
                {monthsList.map(m => (
                  <button
                    key={m.date.toISOString()}
                    onClick={() => setDate(m.date)}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                      isSameMonth(m.date, date) 
                        ? "bg-background shadow-sm text-foreground ring-1 ring-border" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="capitalize">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex flex-col space-y-3 w-full sm:w-auto">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Filtrar por Cartão
                </label>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger className="w-full sm:w-[250px] bg-surface rounded-full h-11 border-border font-medium shadow-sm">
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cartões</SelectItem>
                    {cards.map(card => (
                      <SelectItem key={card.id} value={String(card.id)}>
                        {card.name} ****{card.last_digits}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:pt-7 w-full sm:w-auto">
                <Button asChild className="w-full rounded-full h-11 shadow-sm px-6 font-bold bg-brand hover:opacity-90">
                  <Link href="/cartao/novo"><PlusCircle className="w-5 h-5 mr-2" /> Nova Transação</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Cards de Resumo ──────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total da Fatura Card */}
            <div className="bg-[#219C90] text-white rounded-[24px] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.02]">
              <div className="z-10">
                <p className="text-white/80 font-bold text-xs uppercase tracking-wider mb-2">Total da Fatura</p>
                <h3 className="text-4xl font-black mb-6 tracking-tight">{totalFormatted}</h3>
                <div className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded w-max backdrop-blur-sm",
                  percentageChange >= 0 ? "bg-white/20 text-white" : "bg-white/20 text-white"
                )}>
                  {percentageChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(0)}% vs mês anterior
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 opacity-10 rotate-12">
                <CreditCardIcon className="w-48 h-48" />
              </div>
            </div>

            {/* Fechamento Card */}
            <div className="bg-surface border border-border rounded-[24px] p-8 shadow-sm flex flex-col justify-between transition-transform hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-4">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Fechamento</p>
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
              </div>
              {summaryMetrics?.isSingle ? (
                <>
                  <h3 className="text-3xl font-bold mb-8">{summaryMetrics?.closingStr || '--'}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                      <span className="uppercase tracking-wider">Ciclo {summaryMetrics?.cyclePercentage || 0}% Concluído</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${summaryMetrics?.cyclePercentage || 0}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {summaryMetrics?.items.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground truncate mr-3">
                          {item.cardName} •{item.lastDigits}
                        </span>
                        <span className="text-lg font-bold whitespace-nowrap">{item.closingStr}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>Ciclo</span>
                          <span>{item.cyclePercentage}%</span>
                        </div>
                        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${item.cyclePercentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vencimento Card */}
            <div className="bg-surface border border-border rounded-[24px] p-8 shadow-sm flex flex-col justify-between transition-transform hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-4">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Vencimento</p>
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              {summaryMetrics?.isSingle ? (
                <>
                  <h3 className="text-3xl font-bold mb-8">{summaryMetrics?.dueStr || '--'}</h3>
                  <div>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded w-max uppercase tracking-wider",
                      summaryMetrics?.isOverdue ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                      {summaryMetrics?.isOverdue ? `ATRASADO ${summaryMetrics.daysToDue} DIAS` : `FALTAM ${summaryMetrics?.daysToDue ?? 0} DIAS`}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {summaryMetrics?.items.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground truncate mr-3">
                          {item.cardName} •{item.lastDigits}
                        </span>
                        <span className="text-lg font-bold whitespace-nowrap">{item.dueStr}</span>
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded w-max uppercase tracking-wider",
                        item.isOverdue ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      )}>
                        <Clock className="w-3 h-3" />
                        {item.isOverdue ? `ATRASADO ${item.daysToDue}d` : `FALTAM ${item.daysToDue}d`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Tabela Lançamentos Detalhados ───────────────────────────────── */}
          <div className="bg-surface border border-border rounded-[24px] shadow-sm overflow-hidden mb-8">
            <div className="p-6 sm:px-8 border-b border-border flex justify-between items-center bg-white dark:bg-card">
              <h3 className="text-lg font-bold text-foreground tracking-tight">Lançamentos Detalhados</h3>
              <div className="flex gap-2 text-muted-foreground">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Filter className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Download className="w-4 h-4" /></Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-5 px-8">Descrição</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-5 hidden md:table-cell">Data</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-5">Categoria</TableHead>
                    {selectedCardId === 'all' && (
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-5 hidden lg:table-cell">Cartão</TableHead>
                    )}
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-right py-5 pr-8">Valor</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={selectedCardId === 'all' ? 6 : 5}
                        className="bg-white dark:bg-card text-center py-16 text-muted-foreground font-medium"
                      >
                        Nenhum lançamento no período selecionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExpenses.map((exp) => {
                      const cardIndex = cards.findIndex(c => c.id === exp.card_id)
                      const dotColorClass = getCardDotColor(cardIndex === -1 ? 0 : cardIndex)
                      
                      return (
                        <TableRow key={exp.id} className="group bg-white dark:bg-card border-border/40 hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium p-4 sm:pl-8">
                            <div className="flex items-center gap-4">
                              <div className={cn("p-2.5 rounded-full flex-shrink-0", ExpenseIconBg({ category: exp.category }))}>
                                <ExpenseIcon category={exp.category} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-[15px]">{exp.description}</span>
                                {isMobile && (
                                  <span className="text-xs text-muted-foreground font-medium mt-0.5">
                                    {format(parseLocalDate(exp.created_at), 'dd MMM, yyyy', { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-muted-foreground font-medium hidden md:table-cell">
                            {format(parseLocalDate(exp.created_at), "dd MMM, yyyy", { locale: ptBR })}
                          </TableCell>
                          
                          <TableCell>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground uppercase tracking-widest">
                              {exp.category}
                            </span>
                          </TableCell>
                          
                          {selectedCardId === 'all' && (
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2.5 h-2.5 rounded-full", dotColorClass)} />
                                <span className="text-sm font-semibold text-muted-foreground">{getCardNameShort(exp.card_id)}</span>
                              </div>
                            </TableCell>
                          )}
                          
                          <TableCell className="text-right font-bold text-[15px] pr-8">
                            {Number(exp.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          
                          <TableCell className="pr-4">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" 
                              onClick={() => handleDeleteConfirm(exp.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-4 px-6 border-t border-border flex items-center justify-between bg-white dark:bg-card rounded-b-[24px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Exibindo {paginatedExpenses.length} de {filteredExpenses.length} lançamentos
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full shadow-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full shadow-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Dialog de exclusão ───────────────────────── */}
      <AlertDialog open={alertShow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar a exclusão deste gasto do cartão?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertShow(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
              onClick={handleDelete}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
