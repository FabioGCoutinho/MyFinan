'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import type {
  CreditCardExpense,
  CreditCard as CreditCardType,
  InvoicePayment,
} from '@/lib/credit-card'
import { getInvoicePeriodByDueMonth } from '@/lib/credit-card'
import { formatCurrency, formatVariation, parseLocalDate } from '@/lib/utils'
import { format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarIcon,
  CreditCard as CreditCardLucide,
  DollarSign,
  type LucideIcon,
  Minus,
  MinusCircle,
  PlusCircle,
  Receipt,
  Scale,
  ShoppingBag,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

// ── Tipos ──────────────────────────────────────────────

interface RevenueItem {
  category: string
  created_at: string
  id: number
  obs: string
  revenue: string
  updated_at: Date
  value: number
}

interface ExpenseItem {
  category: string
  created_at: string
  id: number
  obs: string
  expense: string
  updated_at: Date
  value: number
  is_paid: boolean
}

interface KpiItem {
  month: string
  year: number
  revenue: number
  expense: number
  monthIndex: number
  dateLabel?: string
  fullDate?: Date
}

interface ChildComponentProps {
  revenue: RevenueItem[]
  expense: ExpenseItem[]
  kpiUser: KpiItem[]
  creditCards: CreditCardType[]
  creditCardExpenses: CreditCardExpense[]
  invoicePayments: InvoicePayment[]
}

interface KpiCardProps {
  title: string
  value: string
  variation: string
  description: string
  icon: LucideIcon
  bgColor: string
}

// ── Constantes ─────────────────────────────────────────

const chartConfig = {
  expense: {
    label: 'Despesas',
    color: '#2563eb',
  },
  revenue: {
    label: 'Receitas',
    color: '#60a5fa',
  },
} satisfies ChartConfig

const PIE_COLORS = [
  '#8b5cf6', // purple-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
]

const pieChartConfig = {
  value: { label: 'Valor' },
} satisfies ChartConfig

// ── Animação ───────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const stagger = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
}

// ── Helpers ────────────────────────────────────────────

function filterByMonth<T extends { created_at: string }>(
  items: T[],
  date: Date
): T[] {
  return items.filter(item => {
    const d = parseLocalDate(item.created_at)
    return (
      d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    )
  })
}

function sumValues<T extends { value: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.value, 0)
}

function getVariationIcon(variation: string) {
  if (variation.startsWith('+')) return ArrowUpRight
  if (variation.startsWith('-')) return ArrowDownRight
  return Minus
}

function buildMonthOptions(count = 12): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const d = subMonths(startOfMonth(now), i)
    const value = format(d, 'yyyy-MM')
    const label = format(d, "MMMM 'de' yyyy", { locale: ptBR })
    options.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    })
  }

  return options
}

function groupByCategory(
  items: ExpenseItem[]
): { category: string; value: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const cat = item.category || 'Outros'
    map.set(cat, (map.get(cat) || 0) + item.value)
  }
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
}

// ── Tooltip customizado com saldo ──────────────────────

function CustomBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; dataKey: string; color: string }[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const revenueEntry = payload.find(p => p.dataKey === 'revenue')
  const expenseEntry = payload.find(p => p.dataKey === 'expense')
  const revenueVal = revenueEntry?.value ?? 0
  const expenseVal = expenseEntry?.value ?? 0
  const saldo = revenueVal - expenseVal

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartConfig.revenue.color }}
            />
            <span className="text-muted-foreground">Receitas</span>
          </div>
          <span className="font-mono font-medium tabular-nums text-foreground">
            {formatCurrency(revenueVal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: chartConfig.expense.color }}
            />
            <span className="text-muted-foreground">Despesas</span>
          </div>
          <span className="font-mono font-medium tabular-nums text-foreground">
            {formatCurrency(expenseVal)}
          </span>
        </div>
        <div className="border-t border-border pt-1 mt-1 flex items-center justify-between gap-6">
          <span className="text-muted-foreground font-medium">Saldo</span>
          <span
            className={`font-mono font-semibold tabular-nums ${
              saldo >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {formatCurrency(saldo)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Legenda customizada ────────────────────────────────

function ChartLegend() {
  return (
    <div className="flex items-center justify-center gap-6 pt-2">
      <div className="flex items-center gap-1.5">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: chartConfig.revenue.color }}
        />
        <span className="text-xs text-muted-foreground">Receitas</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: chartConfig.expense.color }}
        />
        <span className="text-xs text-muted-foreground">Despesas</span>
      </div>
    </div>
  )
}

// ── Componentes ────────────────────────────────────────

function KpiCard({
  title,
  value,
  variation,
  description,
  icon: Icon,
  bgColor,
}: KpiCardProps) {
  const VariationIcon = getVariationIcon(variation)

  return (
    <Card className={bgColor}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <VariationIcon className="h-3 w-3" />
          {variation} {description}
        </p>
      </CardContent>
    </Card>
  )
}

// ── Componente principal ───────────────────────────────

export function Overview({
  revenue,
  expense,
  kpiUser,
  creditCards,
  creditCardExpenses,
  invoicePayments,
}: ChildComponentProps) {
  const isInvoicePaid = (cardId: number, month: number, year: number) => {
    return invoicePayments.some(
      p => p.card_id === cardId && p.month === month && p.year === year && p.is_paid
    )
  }
  const monthOptions = useMemo(() => buildMonthOptions(12), [])
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)

  const selectedDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }, [selectedMonth])

  const previousMonth = useMemo(
    () => subMonths(selectedDate, 1),
    [selectedDate]
  )

  const isMobile = useIsMobile()

  // Dados do mês selecionado
  const sortedExpense = useMemo(
    () =>
      [...expense].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [expense]
  )

  const despesasFiltradas = useMemo(
    () => filterByMonth(sortedExpense, selectedDate),
    [selectedDate, sortedExpense]
  )

  const receitasFiltradas = useMemo(
    () => filterByMonth(revenue, selectedDate),
    [selectedDate, revenue]
  )

  // Dados do mês anterior (para calcular variação %)
  const despesasMesAnterior = useMemo(
    () => filterByMonth(expense, previousMonth),
    [previousMonth, expense]
  )

  const receitasMesAnterior = useMemo(
    () => filterByMonth(revenue, previousMonth),
    [previousMonth, revenue]
  )

  // ── Faturas de cartão no mês selecionado ───────────

  const cardInvoiceTotals = useMemo(() => {
    return creditCards
      .map(card => {
        const { start, end } = getInvoicePeriodByDueMonth(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
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
  }, [creditCards, creditCardExpenses, selectedDate])

  const totalCartao = useMemo(
    () => cardInvoiceTotals.filter(item => isInvoicePaid(item.card.id, selectedDate.getMonth(), selectedDate.getFullYear())).reduce((sum, item) => sum + item.total, 0),
    [cardInvoiceTotals, invoicePayments, selectedDate]
  )

  // Faturas do mês anterior (para variação)
  const totalCartaoAnterior = useMemo(() => {
    return creditCards.reduce((sum, card) => {
      const { start, end } = getInvoicePeriodByDueMonth(
        previousMonth.getFullYear(),
        previousMonth.getMonth(),
        card.closing_day,
        card.due_day
      )
      
      const isPaid = isInvoicePaid(card.id, previousMonth.getMonth(), previousMonth.getFullYear())
      if (!isPaid) return sum
      
      return (
        sum +
        creditCardExpenses
          .filter(exp => {
            if (exp.card_id !== card.id) return false
            const expDate = parseLocalDate(exp.created_at)
            return expDate >= start && expDate <= end
          })
          .reduce((s, exp) => s + Number(exp.value), 0)
      )
    }, 0)
  }, [creditCards, creditCardExpenses, previousMonth, invoicePayments])

  // Totais memorizados
  const totalReceitas = useMemo(
    () => sumValues(receitasFiltradas),
    [receitasFiltradas]
  )
  const totalDespesasDiretas = useMemo(
    () => sumValues(despesasFiltradas.filter(e => e.is_paid)),
    [despesasFiltradas]
  )
  const totalDespesas = totalDespesasDiretas + totalCartao
  const saldo = totalReceitas - totalDespesas

  const totalReceitasAnterior = useMemo(
    () => sumValues(receitasMesAnterior),
    [receitasMesAnterior]
  )
  const totalDespesasAnterior =
    useMemo(() => sumValues(despesasMesAnterior.filter(e => e.is_paid)), [despesasMesAnterior]) +
    totalCartaoAnterior
  const saldoAnterior = totalReceitasAnterior - totalDespesasAnterior

  // Variações calculadas
  const variacaoReceitas = formatVariation(totalReceitas, totalReceitasAnterior)
  const variacaoDespesas = formatVariation(totalDespesas, totalDespesasAnterior)
  const variacaoSaldo = formatVariation(saldo, saldoAnterior)

  // Últimas atividades — combina despesas diretas + despesas de cartão individuais
  const recentActivities = useMemo(() => {
    type Activity = {
      id: string
      name: string
      date: Date
      dateLabel: string
      category: string
      value: number
      type: 'expense' | 'card'
      cardName?: string
    }

    const activities: Activity[] = []

    // Despesas diretas do mês
    for (const item of despesasFiltradas) {
      activities.push({
        id: `exp-${item.id}`,
        name: item.expense,
        date: parseLocalDate(item.created_at),
        dateLabel: format(parseLocalDate(item.created_at), "dd MMM", { locale: ptBR }),
        category: item.category || 'Outros',
        value: item.value,
        type: 'expense',
      })
    }

    // Despesas individuais de cartão no período da fatura
    for (const card of creditCards) {
      const { start, end } = getInvoicePeriodByDueMonth(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        card.closing_day,
        card.due_day
      )
      const cardExps = creditCardExpenses.filter(exp => {
        if (exp.card_id !== card.id) return false
        const expDate = parseLocalDate(exp.created_at)
        return expDate >= start && expDate <= end
      })
      for (const exp of cardExps) {
        activities.push({
          id: `card-${exp.id}`,
          name: exp.description,
          date: parseLocalDate(exp.created_at),
          dateLabel: format(parseLocalDate(exp.created_at), "dd MMM", { locale: ptBR }),
          category: exp.category || 'Cartão',
          value: Number(exp.value),
          type: 'card',
          cardName: card.name,
        })
      }
    }

    // Ordenar por data mais recente e pegar as 5 primeiras
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  }, [despesasFiltradas, creditCards, creditCardExpenses, selectedDate])

  // Maior despesa do mês (item 5)
  const maiorDespesa = useMemo(() => {
    if (despesasFiltradas.length === 0) return null
    return despesasFiltradas.reduce((max, item) =>
      item.value > max.value ? item : max
    )
  }, [despesasFiltradas])

  // Sparkline data (item 8) — últimos 6 meses de cada métrica
  const sparklineReceitas = useMemo(
    () => kpiUser.slice(-6).map(k => ({ value: k.revenue })),
    [kpiUser]
  )
  const sparklineDespesas = useMemo(
    () => kpiUser.slice(-6).map(k => ({ value: k.expense })),
    [kpiUser]
  )
  const sparklineSaldo = useMemo(
    () => kpiUser.slice(-6).map(k => ({ value: k.revenue - k.expense })),
    [kpiUser]
  )

  // Dados do gráfico de pizza (categorias) — inclui cartão
  const categoryData = useMemo(() => {
    // Despesas diretas
    const combined: { category: string; value: number }[] = despesasFiltradas.map(d => ({
      category: d.category,
      value: d.value,
    }))
    // Despesas de cartão — usando a categoria real de cada despesa
    for (const card of creditCards) {
      const { start, end } = getInvoicePeriodByDueMonth(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        card.closing_day,
        card.due_day
      )
      const cardExps = creditCardExpenses.filter(exp => {
        if (exp.card_id !== card.id) return false
        const expDate = parseLocalDate(exp.created_at)
        return expDate >= start && expDate <= end
      })
      for (const exp of cardExps) {
        combined.push({
          category: exp.category || 'Outros',
          value: Number(exp.value),
        })
      }
    }
    return groupByCategory(combined as ExpenseItem[])
  }, [despesasFiltradas, creditCards, creditCardExpenses, selectedDate])

  // Cor do saldo
  const saldoBg =
    saldo > 0
      ? 'bg-success/15 border border-success/30'
      : saldo < 0
        ? 'bg-danger/15 border border-danger/30'
        : 'bg-brand/15 border border-brand/30'

  // Verifica se o mês tem dados
  const hasAnyData =
    receitasFiltradas.length > 0 ||
    despesasFiltradas.length > 0 ||
    cardInvoiceTotals.length > 0

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-4 overflow-hidden"
    >
      {/* ── Seletor de mês ──────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Estado vazio global (item 7) ────────────── */}
      {!hasAnyData ? (
        <motion.div variants={fadeInUp}>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum dado neste mês</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Você ainda não registrou receitas ou despesas para este período.
                Comece agora e acompanhe suas finanças!
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/receitas/novo"
                  className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/80 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Receita
                </Link>
                <Link
                  href="/despesas/novo"
                  className="inline-flex items-center gap-1.5 rounded-md bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:bg-danger/80 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Despesa
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* ── KPI Cards (com sparklines - item 8) ──── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMonth}
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <motion.div variants={fadeInUp}>
                <KpiCard
                  title="Total das Receitas"
                  value={formatCurrency(totalReceitas)}
                  variation={variacaoReceitas}
                  description="em relação ao mês anterior"
                  icon={DollarSign}
                  bgColor="bg-success/15 border border-success/30"
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <KpiCard
                  title="Total das Despesas"
                  value={formatCurrency(totalDespesas)}
                  variation={variacaoDespesas}
                  description="em relação ao mês anterior"
                  icon={Users}
                  bgColor="bg-danger/15 border border-danger/30"
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <KpiCard
                  title="Fatura dos Cartões"
                  value={formatCurrency(totalCartao)}
                  variation={formatVariation(totalCartao, totalCartaoAnterior)}
                  description="em relação ao mês anterior"
                  icon={CreditCardLucide}
                  bgColor="bg-info/15 border border-info/30"
                />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <KpiCard
                  title="Saldo"
                  value={formatCurrency(saldo)}
                  variation={variacaoSaldo}
                  description="em relação ao mês anterior"
                  icon={Scale}
                  bgColor={saldoBg}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* ── Maior despesa do mês (item 5) ────────── */}
          {maiorDespesa && (
            <motion.div variants={fadeInUp}>
              <Card className="border-warning/30 bg-warning/15">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning/15">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-warning">
                      Maior despesa do mês
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold">
                      {maiorDespesa.expense}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {maiorDespesa.category} ·{' '}
                      {format(
                        parseLocalDate(maiorDespesa.created_at),
                        "dd 'de' MMMM",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(maiorDespesa.value)}
                    </p>
                    {totalDespesas > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {((maiorDespesa.value / totalDespesas) * 100).toFixed(
                          0
                        )}
                        % do total
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Gráficos (tooltip melhorado + legenda - item 9) */}
          <motion.div variants={fadeInUp} className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={chartConfig}
                  className="min-h-[150px] w-full"
                >
                  {isMobile ? (
                    <AreaChart accessibilityLayer data={kpiUser}>
                      <defs>
                        <linearGradient
                          id="fillRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-revenue)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-revenue)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="fillExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-expense)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-expense)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<CustomBarTooltip />}
                      />
                      <Area
                        dataKey="revenue"
                        type="natural"
                        fill="url(#fillRevenue)"
                        stroke="var(--color-revenue)"
                        stackId="a"
                      />
                      <Area
                        dataKey="expense"
                        type="natural"
                        fill="url(#fillExpense)"
                        stroke="var(--color-expense)"
                        stackId="b"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart accessibilityLayer data={kpiUser}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="dateLabel"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={value => `R$ ${value}`}
                        domain={[
                          0,
                          (dataMax: number) => Math.ceil(dataMax / 500) * 500,
                        ]}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<CustomBarTooltip />}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="var(--color-revenue)"
                        radius={4}
                      />
                      <Bar
                        dataKey="expense"
                        fill="var(--color-expense)"
                        radius={4}
                      />
                    </BarChart>
                  )}
                </ChartContainer>
                <ChartLegend />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      Sem dados de categorias
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Registre despesas para ver a distribuição por categoria
                    </p>
                    <Link
                      href="/despesas/novo"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand/80 transition-colors"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Adicionar despesa
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <ChartContainer
                      config={pieChartConfig}
                      className="min-h-[200px] w-full max-w-[250px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={value => (
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                  {formatCurrency(Number(value))}
                                </span>
                              )}
                              nameKey="category"
                            />
                          }
                        />
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={entry.category}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>

                    {/* Legenda */}
                    <div className="grid grid-cols-1 gap-y-2 w-full">
                      {categoryData.map((item, index) => {
                        const pct =
                          totalDespesas > 0
                            ? ((item.value / totalDespesas) * 100).toFixed(1)
                            : '0'
                        return (
                          <div
                            key={item.category}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    PIE_COLORS[index % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-sm truncate">
                                {item.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {formatCurrency(item.value)}
                              </span>
                              <span>({pct}%)</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Atividades Recentes ────────────────────── */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Atividades Recentes</CardTitle>
                <Link
                  href="/despesas"
                  className="text-sm font-medium text-brand hover:text-brand/80 transition-colors"
                >
                  Ver tudo
                </Link>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <TrendingDown className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Sem atividades</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Nenhuma despesa registrada neste mês
                    </p>
                    <Link
                      href="/despesas/novo"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand/80 transition-colors"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Registrar despesa
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        {/* Ícone */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          activity.type === 'card'
                            ? 'bg-info/15 text-info'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {activity.type === 'card'
                            ? <CreditCardLucide className="h-4 w-4" />
                            : <ShoppingBag className="h-4 w-4" />
                          }
                        </div>

                        {/* Nome + data/categoria */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {activity.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.dateLabel} • {activity.type === 'card' && activity.cardName ? `${activity.cardName} • ` : ''}{activity.category}
                          </p>
                        </div>

                        {/* Valor */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-danger">
                            - {formatCurrency(activity.value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
