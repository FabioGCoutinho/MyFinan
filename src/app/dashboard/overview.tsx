'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatCurrency, formatVariation } from '@/lib/utils'
import { format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  type LucideIcon,
  Minus,
  Receipt,
  Scale,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
}

interface KpiItem {
  month: string
  year: number
  revenue: number
  expense: number
  monthIndex: number
}

interface ChildComponentProps {
  revenue: RevenueItem[]
  expense: ExpenseItem[]
  kpiUser: KpiItem[]
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

// ── Hooks ──────────────────────────────────────────────

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

// ── Helpers ────────────────────────────────────────────

function filterByMonth<T extends { created_at: string }>(
  items: T[],
  date: Date
): T[] {
  return items.filter(item => {
    const d = parseISO(item.created_at)
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

// ── Tooltip formatter compartilhado ────────────────────

const tooltipFormatter = (
  value: string | number | (string | number)[],
  name: string | number
) => (
  <div className="flex min-w-[150px] items-center text-xs text-muted-foreground">
    {chartConfig[String(name) as keyof typeof chartConfig]?.label || name}
    <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
      {formatCurrency(Number(value))}
    </div>
  </div>
)

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

export function Overview({ revenue, expense, kpiUser }: ChildComponentProps) {
  const currentMonth = useMemo(() => startOfMonth(new Date()), [])
  const previousMonth = useMemo(
    () => subMonths(currentMonth, 1),
    [currentMonth]
  )
  const isMobile = useIsMobile()

  // Dados do mês atual
  const sortedExpense = useMemo(
    () =>
      [...expense].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [expense]
  )

  const despesasFiltradas = useMemo(
    () => filterByMonth(sortedExpense, currentMonth),
    [currentMonth, sortedExpense]
  )

  const receitasFiltradas = useMemo(
    () => filterByMonth(revenue, currentMonth),
    [currentMonth, revenue]
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

  // Totais memorizados
  const totalReceitas = useMemo(
    () => sumValues(receitasFiltradas),
    [receitasFiltradas]
  )
  const totalDespesas = useMemo(
    () => sumValues(despesasFiltradas),
    [despesasFiltradas]
  )
  const saldo = totalReceitas - totalDespesas

  const totalReceitasAnterior = useMemo(
    () => sumValues(receitasMesAnterior),
    [receitasMesAnterior]
  )
  const totalDespesasAnterior = useMemo(
    () => sumValues(despesasMesAnterior),
    [despesasMesAnterior]
  )
  const saldoAnterior = totalReceitasAnterior - totalDespesasAnterior

  // Variações calculadas
  const variacaoReceitas = formatVariation(totalReceitas, totalReceitasAnterior)
  const variacaoDespesas = formatVariation(totalDespesas, totalDespesasAnterior)
  const variacaoQtdDespesas = formatVariation(
    despesasFiltradas.length,
    despesasMesAnterior.length
  )
  const variacaoSaldo = formatVariation(saldo, saldoAnterior)

  // Últimas 5 despesas
  const lastFiveItems = despesasFiltradas.slice(0, 5)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total das Receitas"
          value={formatCurrency(totalReceitas)}
          variation={variacaoReceitas}
          description="em relação ao mês passado"
          icon={DollarSign}
          bgColor="bg-green-800"
        />
        <KpiCard
          title="Total das Despesas"
          value={formatCurrency(totalDespesas)}
          variation={variacaoDespesas}
          description="em relação ao mês passado"
          icon={Users}
          bgColor="bg-red-800"
        />
        <KpiCard
          title="Qnt. de Despesas"
          value={`${despesasFiltradas.length} ${despesasFiltradas.length <= 1 ? 'Despesa' : 'Despesas'} no mês`}
          variation={variacaoQtdDespesas}
          description="em relação ao mês passado"
          icon={Receipt}
          bgColor="bg-blue-800"
        />
        <KpiCard
          title="Saldo"
          value={formatCurrency(saldo)}
          variation={variacaoSaldo}
          description="em relação ao mês passado"
          icon={Scale}
          bgColor="bg-purple-800"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer
              config={chartConfig}
              className="min-h-[200px] w-full"
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
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={tooltipFormatter}
                      />
                    }
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
                    tickFormatter={value => `R$ ${value}`}
                    domain={[
                      0,
                      (dataMax: number) => Math.ceil(dataMax / 500) * 500,
                    ]}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dashed"
                        formatter={tooltipFormatter}
                      />
                    }
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
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Últimas 5 Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {lastFiveItems.length <= 0 ? (
                <h1>Nenhuma despesa esse mês</h1>
              ) : (
                lastFiveItems.map(item => (
                  <div key={item.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.expense}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          parseISO(item.created_at),
                          "EEEE, dd 'de' LLLL 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
