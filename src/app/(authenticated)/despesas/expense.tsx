'use client'

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'


import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSort } from '@/hooks/use-sort'
import { ExpenseCategoryIcon, expenseCategoryBg } from '@/lib/categories'
import type { CreditCard, CreditCardExpense, InvoicePayment } from '@/lib/credit-card'
import { getInvoicePeriodByDueMonth } from '@/lib/credit-card'
import type { UnifiedExpenseItem } from '@/lib/types'
import { cn, parseLocalDate } from '@/lib/utils'
import { createClient } from '@/util/supabase/client'
import {
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CreditCard as CreditCardIcon,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  PlusCircle,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface ChildComponentProps {
  expense: {
    category: string
    created_at: string
    id: number
    obs: string
    expense: string
    updated_at: Date
    value: number
    is_paid: boolean
  }[]
  creditCards: CreditCard[]
  creditCardExpenses: CreditCardExpense[]
  invoicePayments: InvoicePayment[]
  onActionCompleted: () => void
}

type PaymentFilter = 'Todas' | 'Pendentes' | 'Pagas'

export function Expense({
  expense,
  creditCards,
  creditCardExpenses,
  invoicePayments,
  onActionCompleted,
}: ChildComponentProps) {
  const supabase = useMemo(() => createClient(), [])

  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )

  const monthsList = useMemo(() => {
    const center = parseLocalDate(selectedMonth)
    return Array.from({ length: 5 }).map((_, i) => {
      const d = addMonths(center, i - 2)
      return {
        date: startOfMonth(d),
        value: format(startOfMonth(d), 'yyyy-MM-dd'),
        label: format(d, 'MMM', { locale: ptBR }),
      }
    })
  }, [selectedMonth])
  const [categoria, setCategoria] = useState('Todas')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('Todas')
  const { sortField, sortDirection, handleSort, renderSortIcon } = useSort()
  const [alertShow, setAlertShow] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [expenseTarget, setExpenseTarget] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const isInvoicePaid = (cardId: number, month: number, year: number) => {
    return invoicePayments.some(
      p => p.card_id === cardId && p.month === month && p.year === year && p.is_paid
    )
  }

  const isMobile = useIsMobile()

  useEffect(() => {
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.expense_target) {
        setExpenseTarget(Number(user.user_metadata.expense_target))
      }
    })
  }, [supabase])

  // Process Invoices for Selected Month
  const cardInvoiceTotals = useMemo(() => {
    const sDate = parseLocalDate(selectedMonth)
    return creditCards
      .map(card => {
        const { start, end } = getInvoicePeriodByDueMonth(
          sDate.getFullYear(),
          sDate.getMonth(),
          card.closing_day,
          card.due_day
        )
        const total = creditCardExpenses
          .filter(exp => {
            if (exp.card_id !== card.id) return false
            const expDate = parseLocalDate(exp.created_at)
            return expDate >= start && expDate <= end
          })
          .reduce((sum, exp) => sum + Number(exp.value), 0)
        return { card, total }
      })
      .filter(item => item.total > 0)
  }, [creditCards, creditCardExpenses, selectedMonth])

  // Process Invoices for Previous Month
  const prevCardInvoiceTotals = useMemo(() => {
    const sDate = parseLocalDate(selectedMonth)
    const prevDate = subMonths(sDate, 1)
    return creditCards
      .map(card => {
        const { start, end } = getInvoicePeriodByDueMonth(
          prevDate.getFullYear(),
          prevDate.getMonth(),
          card.closing_day,
          card.due_day
        )
        const total = creditCardExpenses
          .filter(exp => {
            if (exp.card_id !== card.id) return false
            const expDate = parseLocalDate(exp.created_at)
            return expDate >= start && expDate <= end
          })
          .reduce((sum, exp) => sum + Number(exp.value), 0)
        return { card, total }
      })
      .filter(item => item.total > 0)
  }, [creditCards, creditCardExpenses, selectedMonth])

  const { paidTotal, forecastTotal, previousMonthTotal } = useMemo(() => {
    const currentMonthDate = parseLocalDate(selectedMonth)
    const previousMonthDate = subMonths(currentMonthDate, 1)

    let paid = 0
    let forecast = 0
    let previous = 0

    for (const r of expense) {
      const d = parseLocalDate(r.created_at)
      if (
        d.getFullYear() === currentMonthDate.getFullYear() &&
        d.getMonth() === currentMonthDate.getMonth()
      ) {
        forecast += r.value
        if (r.is_paid) paid += r.value
      }
      if (
        d.getFullYear() === previousMonthDate.getFullYear() &&
        d.getMonth() === previousMonthDate.getMonth()
      ) {
        previous += r.value
      }
    }

    // Card invoices
    const sDate = parseLocalDate(selectedMonth)
    for (const { card, total } of cardInvoiceTotals) {
      forecast += total
      if (isInvoicePaid(card.id, sDate.getMonth(), sDate.getFullYear())) {
        paid += total
      }
    }
    previous += prevCardInvoiceTotals.reduce((sum, item) => sum + item.total, 0)

    return { paidTotal: paid, forecastTotal: forecast, previousMonthTotal: previous }
  }, [selectedMonth, expense, cardInvoiceTotals, prevCardInvoiceTotals, invoicePayments])

  const percentageChange =
    previousMonthTotal === 0
      ? forecastTotal > 0
        ? 100
        : 0
      : ((forecastTotal - previousMonthTotal) / previousMonthTotal) * 100

  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {}
    const sDate = parseLocalDate(selectedMonth)

    // Despesas diretas do mês
    for (const item of expense) {
      const dDate = parseLocalDate(item.created_at)
      if (
        dDate.getMonth() === sDate.getMonth() &&
        dDate.getFullYear() === sDate.getFullYear()
      ) {
        const cat = item.category.toUpperCase()
        totals[cat] = (totals[cat] || 0) + item.value
      }
    }

    // Despesas de cartão — usando a categoria real de cada despesa
    for (const card of creditCards) {
      const { start, end } = getInvoicePeriodByDueMonth(
        sDate.getFullYear(),
        sDate.getMonth(),
        card.closing_day,
        card.due_day
      )
      for (const exp of creditCardExpenses) {
        if (exp.card_id !== card.id) continue
        const expDate = parseLocalDate(exp.created_at)
        if (expDate < start || expDate > end) continue
        const cat = (exp.category || 'OUTROS').toUpperCase()
        totals[cat] = (totals[cat] || 0) + Number(exp.value)
      }
    }

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10
  }, [expense, creditCards, creditCardExpenses, selectedMonth])

  const CHART_COLORS = ['#2563eb', '#14b8a6', '#64748b', '#cbd5e1']

  const unifiedList = useMemo(() => {
    const list: UnifiedExpenseItem[] = []
    const sDate = parseLocalDate(selectedMonth)

    // Despesas normais
    for (const despesa of expense) {
      const dDate = parseLocalDate(despesa.created_at)
      if (
        dDate.getMonth() === sDate.getMonth() &&
        dDate.getFullYear() === sDate.getFullYear() &&
        (categoria === 'Todas' || despesa.category === categoria)
      ) {
        list.push({
          id: despesa.id,
          type: 'expense',
          description: despesa.expense,
          obs: despesa.obs,
          category: despesa.category,
          date: despesa.created_at,
          value: despesa.value,
          is_paid: despesa.is_paid,
        })
      }
    }

    // Faturas de Cartão
    if (categoria === 'Todas' || categoria === 'Cartão') {
      for (const { card, total } of cardInvoiceTotals) {
        const mockDate = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          card.due_day
        )
        list.push({
          id: `card-${card.id}`,
          type: 'card',
          description: `Fatura ${card.name}`,
          obs: `****${card.last_digits} · Venc. dia ${card.due_day}`,
          category: 'Cartão',
          date: mockDate.toISOString(),
          value: total,
          is_paid: isInvoicePaid(card.id, sDate.getMonth(), sDate.getFullYear()),
        })
      }
    }

    // Filtro de pagamento
    const filtered = paymentFilter === 'Todas'
      ? list
      : list.filter(item =>
          paymentFilter === 'Pagas' ? item.is_paid : !item.is_paid
        )

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: string | number = 0
        let bValue: string | number = 0
        switch (sortField) {
          case 'descricao':
            aValue = a.description.toLowerCase()
            bValue = b.description.toLowerCase()
            break
          case 'categoria':
            aValue = a.category.toLowerCase()
            bValue = b.category.toLowerCase()
            break
          case 'data':
            aValue = parseLocalDate(a.date).getTime()
            bValue = parseLocalDate(b.date).getTime()
            break
          case 'valor':
            aValue = a.value
            bValue = b.value
            break
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    } else {
      filtered.sort((a, b) => {
        return (
          parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
        )
      })
    }

    return filtered
  }, [
    selectedMonth,
    categoria,
    paymentFilter,
    expense,
    cardInvoiceTotals,
    invoicePayments,
    sortField,
    sortDirection,
  ])

  function handleDeledConfirm(id: number, type: string) {
    if (type === 'card') return
    setAlertShow(true)
    setSelectedId(id)
  }

  const handleMarkAsPaid = async (item: UnifiedExpenseItem) => {
    try {
      if (item.type === 'expense') {
        await supabase.from('expense').update({ is_paid: true }).eq('id', item.id)
      } else if (item.type === 'card') {
        const sDate = parseLocalDate(selectedMonth)
        const cardId = Number(String(item.id).replace('card-', ''))
        await supabase.from('invoice_payment').upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          card_id: cardId,
          month: sDate.getMonth(),
          year: sDate.getFullYear(),
          is_paid: true,
          paid_at: new Date().toISOString(),
        }, { onConflict: 'user_id,card_id,month,year' })
      }
      onActionCompleted()
    } catch (err) {
      console.error('Erro ao marcar como paga:', err)
    }
  }

  const handleDeledExpense = async () => {
    try {
      await supabase.from('expense').delete().eq('id', selectedId)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado'
      setError(message)
      console.error(message)
    }

    setAlertShow(false)
    onActionCompleted()
  }

  // Progress Bar e Metas
  const showProgress = expenseTarget !== null && expenseTarget > 0
  const progressPercentage = showProgress
    ? Math.min((forecastTotal / expenseTarget) * 100, 100)
    : 100
  const progressPercentText = showProgress
    ? ((forecastTotal / expenseTarget) * 100).toFixed(1)
    : '100'

  // Pagination Logic
  const itemsPerPage = isMobile ? 10 : 15
  const totalPages = Math.max(1, Math.ceil(unifiedList.length / itemsPerPage))
  const paginatedExpenses = unifiedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="w-full flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Controle de Caixa
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight mt-1">
            Minhas Despesas
          </h2>
        </div>
        <Button asChild className="px-6 font-semibold">
          <Link href="/despesas/novo">
            <PlusCircle className="mr-2 h-5 w-5 text-white" /> Nova Despesa
          </Link>
        </Button>
      </div>

      {/* Hero Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Card: Pagas + Previstas */}
        <div className="bg-card dark:bg-card/50 border rounded-2xl p-8 shadow-sm flex flex-col relative overflow-hidden">
          <p className="text-muted-foreground font-bold mb-4">
            Despesas Pagas (
            <span className="capitalize">
              {format(parseLocalDate(selectedMonth), 'MMMM yyyy', {
                locale: ptBR,
              })}
            </span>
            )
          </p>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$</span>
            <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
              {paidTotal.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Previstas</span>
            </div>
            <span className="text-lg font-extrabold text-foreground">
              {forecastTotal.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>

          <div className="mt-auto relative z-10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                ORÇAMENTO UTILIZADO
              </p>
              <p className="font-bold text-foreground">
                {showProgress ? `${progressPercentText}%` : 'N/A'}
              </p>
            </div>

            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden mb-3">
              {showProgress && (
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progressPercentage > 90
                      ? 'bg-destructive'
                      : progressPercentage > 75
                        ? 'bg-orange-500'
                        : 'bg-[#14b8a6]'
                  )}
                  style={{ width: `${progressPercentage}%` }}
                />
              )}
            </div>

            {showProgress ? (
              <p className="text-xs text-muted-foreground font-medium w-3/4">
                Você está{' '}
                {forecastTotal > (expenseTarget || 0) ? 'acima' : 'dentro'}{' '}
                da meta de R${' '}
                {expenseTarget?.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground font-medium">
                Sem meta mensal configurada.
              </p>
            )}
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none">
            <Wallet className="w-48 h-48" />
          </div>
        </div>

        {/* Right Card: Gráfico */}
        <div className="lg:col-span-2 bg-[#f0f4ff] dark:bg-card/50 border rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200">
              Distribuição por Categoria
            </h3>
            <div className="flex bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
              <button
                type="button"
                className="px-4 py-1.5 text-sm font-bold text-[#2563eb] dark:text-[#3b82f6] bg-blue-50/50 dark:bg-slate-700 rounded-full"
              >
                Mensal
              </button>
              <button
                type="button"
                className="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                Semanal
              </button>
            </div>
          </div>

          <div className="w-full mt-auto">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={categoryChartData} barSize={48}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#0a4881',
                    color: '#fff',
                  }}
                  formatter={(value: number) =>
                    value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="space-y-3 w-full lg:w-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Período de Referência
          </p>
          <div className="flex bg-surface border border-border rounded-full p-1.5 w-full lg:w-auto overflow-x-auto gap-1 shadow-sm">
            {monthsList.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setSelectedMonth(m.value)}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap',
                  selectedMonth === m.value
                    ? 'bg-background shadow-sm text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span className="capitalize">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 w-full lg:w-auto">
          <div className="flex flex-col space-y-3 w-full sm:w-auto">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Filtrar por Categoria
            </p>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="w-full sm:w-[220px] bg-surface rounded-full h-11 border-border font-medium shadow-sm">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas Categorias</SelectItem>
                <SelectItem value="Alimentação">Alimentação</SelectItem>
                <SelectItem value="Contas">Contas</SelectItem>
                <SelectItem value="Dívidas">Dívidas</SelectItem>
                <SelectItem value="Doações">Doações</SelectItem>
                <SelectItem value="Educação">Educação</SelectItem>
                <SelectItem value="Impostos">Impostos</SelectItem>
                <SelectItem value="Lazer">Lazer</SelectItem>
                <SelectItem value="Moradia">Moradia</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Transporte">Transporte</SelectItem>
                <SelectItem value="Vestuário">Vestuário</SelectItem>
                <SelectItem value="Cartão">Cartão (Faturas)</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-3 w-full sm:w-auto">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Status de Pagamento
            </p>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-surface rounded-full h-11 border-border font-medium shadow-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                <SelectItem value="Pendentes">Pendentes</SelectItem>
                <SelectItem value="Pagas">Pagas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            type="button"
            className="h-11 font-bold text-brand hover:bg-brand/10"
            onClick={() => {
              setCategoria('Todas')
              setPaymentFilter('Todas')
              setSelectedMonth(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* List Headers */}
      {!isMobile && (
        <div className="grid grid-cols-[1fr_150px_120px_100px_160px_60px] gap-4 px-6 py-3 mb-2 text-xs font-bold text-muted-foreground tracking-wider">
          <button
            type="button"
            onClick={() => handleSort('descricao')}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Descrição {renderSortIcon('descricao')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('categoria')}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Categoria {renderSortIcon('categoria')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('data')}
            className="text-left flex items-center hover:text-foreground transition-colors"
          >
            Data {renderSortIcon('data')}
          </button>
          <div className="text-left">Status</div>
          <button
            type="button"
            onClick={() => handleSort('valor')}
            className="text-right flex items-center justify-end hover:text-foreground transition-colors"
          >
            Valor {renderSortIcon('valor')}
          </button>
          <div className="text-center">Ação</div>
        </div>
      )}

      {/* List Items */}
      <div className="space-y-3">
        {paginatedExpenses.length > 0 ? (
          paginatedExpenses.map(item => (
            <div
              key={item.id}
              className="bg-card border rounded-2xl p-4 sm:px-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:grid sm:grid-cols-[1fr_150px_120px_100px_160px_60px] items-start sm:items-center gap-4 group"
            >
              {/* Descrição */}
              <div className="flex items-center gap-4 w-full">
                <div
                  className={cn(
                    'p-3 rounded-xl flex-shrink-0',
                    expenseCategoryBg(item.category)
                  )}
                >
                  <ExpenseCategoryIcon category={item.category} />
                </div>
                <div className="min-w-0">
                  {item.type === 'card' ? (
                    <Link
                      href="/cartao"
                      className="font-bold text-foreground truncate hover:text-info transition-colors block"
                    >
                      {item.description}
                    </Link>
                  ) : (
                    <p className="font-bold text-foreground truncate">
                      {item.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground truncate max-w-[200px] xl:max-w-[400px]">
                    {item.obs || 'Sem descrição'}
                  </p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 sm:contents">
                {/* Categoria */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Categoria
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                      item.type === 'card'
                        ? 'bg-info/20 text-info'
                        : 'bg-surface text-surface-foreground'
                    )}
                  >
                    {item.category.toLowerCase()}
                  </span>
                </div>

                {/* Data */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block text-muted-foreground text-sm font-medium">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Data
                  </span>
                  {format(parseLocalDate(item.date), 'dd MMM, yyyy', {
                    locale: ptBR,
                  })}
                </div>

                {/* Status */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Status
                  </span>
                  {item.is_paid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Paga
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaid(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-emerald-50 hover:dark:bg-emerald-900/30 hover:text-emerald-600 hover:dark:text-emerald-400 transition-colors cursor-pointer"
                      title="Marcar como paga"
                    >
                      <CircleDollarSign className="w-3 h-3" /> Pendente
                    </button>
                  )}
                </div>

                {/* Valor */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block text-left sm:text-right">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Valor
                  </span>
                  <span
                    className={cn(
                      'font-bold text-lg',
                      item.type === 'card' ? 'text-info' : 'text-foreground'
                    )}
                  >
                    {item.value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>

                {/* Ação */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:block sm:justify-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider sm:hidden">
                    Ação
                  </span>
                  {item.type === 'card' ? (
                    <div className="h-8 w-8" />
                  ) : (
                    <Button
                      variant="ghost"
                      type="button"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeledConfirm(item.id, item.type)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-surface border rounded-2xl text-muted-foreground">
            {expensesEmptyMessage(selectedMonth)}
          </div>
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={unifiedList.length}
        visibleItems={paginatedExpenses.length}
        onPageChange={setCurrentPage}
      />

      <DeleteConfirmDialog
        open={alertShow}
        title="Excluir Despesa"
        description="Tem certeza que deseja excluir esta despesa permanentemente? Essa ação não pode ser desfeita."
        onCancel={() => setAlertShow(false)}
        onConfirm={handleDeledExpense}
      />
    </div>
  )
}

function expensesEmptyMessage(month: string) {
  const d = parseLocalDate(month)
  return `Nenhuma despesa encontrada em ${format(d, 'MMMM', { locale: ptBR })}.`
}
