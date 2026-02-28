'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency, formatVariation } from '@/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyHistory } from './utils'

// ── Chart config ───────────────────────────────────────
const chartConfig = {
  balance: {
    label: 'Saldo',
    color: '#8b5cf6',
  },
  revenue: {
    label: 'Receitas',
    color: '#22c55e',
  },
  expense: {
    label: 'Despesas',
    color: '#ef4444',
  },
} satisfies ChartConfig

// ── Tooltip personalizado ──────────────────────────────
function CustomLineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; dataKey: string; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-semibold text-sm">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}:
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────
interface RelatorioProps {
  kpiUser: MonthlyHistory[]
}

export function Relatorio({ kpiUser }: RelatorioProps) {
  const isMobile = useIsMobile()

  // Dados do gráfico com saldo calculado
  const chartData = useMemo(
    () =>
      kpiUser.map(m => ({
        ...m,
        balance: m.revenue - m.expense,
      })),
    [kpiUser]
  )

  // Métricas acumuladas
  const metrics = useMemo(() => {
    const mesesComDados = chartData.filter(m => m.revenue > 0 || m.expense > 0)
    const total = mesesComDados.length || 1

    const avgRevenue = mesesComDados.reduce((s, m) => s + m.revenue, 0) / total
    const avgExpense = mesesComDados.reduce((s, m) => s + m.expense, 0) / total
    const avgBalance = avgRevenue - avgExpense

    const bestMonth = mesesComDados.reduce(
      (best, m) => (m.balance > best.balance ? m : best),
      mesesComDados[0] ?? { dateLabel: '-', balance: 0 }
    )
    const worstMonth = mesesComDados.reduce(
      (worst, m) => (m.balance < worst.balance ? m : worst),
      mesesComDados[0] ?? { dateLabel: '-', balance: 0 }
    )

    const totalRevenue = mesesComDados.reduce((s, m) => s + m.revenue, 0)
    const totalExpense = mesesComDados.reduce((s, m) => s + m.expense, 0)
    const savingsRate =
      totalRevenue > 0
        ? ((totalRevenue - totalExpense) / totalRevenue) * 100
        : 0

    return {
      avgRevenue,
      avgExpense,
      avgBalance,
      bestMonth,
      worstMonth,
      savingsRate,
    }
  }, [chartData])

  return (
    <div className="space-y-6">
      {/* ── Métricas acumuladas ─────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Média Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold text-success">
              {formatCurrency(metrics.avgRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Média Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold text-danger">
              {formatCurrency(metrics.avgExpense)}
            </p>
            <p className="text-xs text-muted-foreground">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Melhor Mês</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold text-success">
              {formatCurrency(metrics.bestMonth.balance)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.bestMonth.dateLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pior Mês</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <p className="text-xl md:text-2xl font-bold text-danger">
              {formatCurrency(metrics.worstMonth.balance)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.worstMonth.dateLabel}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Gráfico de evolução ─────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Evolução Financeira</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimos 12 meses — receitas, despesas e saldo
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Taxa de economia:</span>
            <span
              className={`font-semibold ${
                metrics.savingsRate >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {metrics.savingsRate.toFixed(1).replace('.', ',')}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <LineChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey={isMobile ? 'month' : 'dateLabel'}
                tickLine={false}
                tickMargin={8}
                axisLine={false}
              />
              {!isMobile && (
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  tickFormatter={v => `R$ ${v}`}
                />
              )}
              <ReferenceLine y={0} stroke="#888888" strokeDasharray="3 3" />
              <ChartTooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="var(--color-expense)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>

          {/* Legenda manual */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-8 rounded-full"
                style={{ backgroundColor: chartConfig.revenue.color }}
              />
              <span className="text-muted-foreground">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-8 rounded-full"
                style={{ backgroundColor: chartConfig.expense.color }}
              />
              <span className="text-muted-foreground">Despesas</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-8 rounded-full border-2 border-dashed"
                style={{ borderColor: chartConfig.balance.color }}
              />
              <span className="text-muted-foreground">Saldo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabela comparativa mês a mês ────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo Mensal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Variação mês a mês com receitas, despesas e saldo
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  Var. Saldo
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((m, i) => {
                const prevBalance = i > 0 ? chartData[i - 1].balance : null

                return (
                  <TableRow key={m.dateLabel}>
                    <TableCell className="font-medium">
                      {isMobile ? m.month : m.dateLabel}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatCurrency(m.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-danger">
                      {formatCurrency(m.expense)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        m.balance >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {formatCurrency(m.balance)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {prevBalance !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 text-sm ${
                            m.balance >= prevBalance
                              ? 'text-success'
                              : 'text-danger'
                          }`}
                        >
                          {m.balance >= prevBalance ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {formatVariation(m.balance, prevBalance)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
