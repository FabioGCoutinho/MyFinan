'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, Users } from 'lucide-react'
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

interface ChildComponentProps {
  revenue: {
    category: string
    created_at: string
    id: number
    obs: string
    revenue: string
    updated_at: Date
    value: number
  }[]
  expense: {
    category: string
    created_at: string
    id: number
    obs: string
    expense: string
    updated_at: Date
    value: number
  }[]
  kpiUser: {
    month: string
    year: number
    revenue: number
    expense: number
    monthIndex: number
  }[]
}

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

export function Overview({ revenue, expense, kpiUser }: ChildComponentProps) {
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))
  const isMobile = useIsMobile()

  // Ordenar o array pelo campo de data em ordem decrescente
  const sortedExpense = useMemo(
    () =>
      [...expense].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [expense]
  )

  // Filtrar dados diretamente via useMemo (sem flash de dados não filtrados)
  const despesasFiltradas = useMemo(
    () =>
      sortedExpense.filter(despesa => {
        const despesaDate = parseISO(despesa.created_at)
        return (
          despesaDate.getMonth() === date.getMonth() &&
          despesaDate.getFullYear() === date.getFullYear()
        )
      }),
    [date, sortedExpense]
  )

  const receitasFiltradas = useMemo(
    () =>
      revenue.filter(rev => {
        const revenueDate = parseISO(rev.created_at)
        return (
          revenueDate.getMonth() === date.getMonth() &&
          revenueDate.getFullYear() === date.getFullYear()
        )
      }),
    [date, revenue]
  )

  //faz a subitração da receita com a despesa
  const total =
    receitasFiltradas.reduce((sum, item) => sum + item.value, 0) -
    despesasFiltradas.reduce((sum, item) => sum + item.value, 0)

  // Exibir apenas os últimos 5 itens
  const lastFiveItems = despesasFiltradas.slice(0, 5)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total das Receitas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receitasFiltradas
                .reduce((sum, item) => sum + item.value, 0)
                .toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
            </div>
            <p className="text-xs text-muted-foreground">
              +20,1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total das Despesas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {despesasFiltradas
                .reduce((sum, item) => sum + item.value, 0)
                .toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
            </div>
            <p className="text-xs text-muted-foreground">
              +180,1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Qnt. de Despesas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {despesasFiltradas.length}{' '}
              {despesasFiltradas.length <= 1 ? 'Despesa' : 'Despesas'} no mês
            </div>
            <p className="text-xs text-muted-foreground">
              +19% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">Receita - Despesa</p>
          </CardContent>
        </Card>
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
                        formatter={(value, name) => (
                          <div className="flex min-w-[150px] items-center text-xs text-muted-foreground">
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label || name}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(Number(value))}
                            </div>
                          </div>
                        )}
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
                        formatter={(value, name) => (
                          <div className="flex min-w-[150px] items-center text-xs text-muted-foreground">
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label || name}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(Number(value))}
                            </div>
                          </div>
                        )}
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
                          {
                            locale: ptBR,
                          }
                        )}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {item.value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
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
