'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DollarSign, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

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
}

const data = [
  { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Fev', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Abr', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mai', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Ago', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Set', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Out', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Dez', total: Math.floor(Math.random() * 5000) + 1000 },
]

export function Overview({ revenue, expense }: ChildComponentProps) {
  const [despesasFiltradas, setDespesasFiltradas] = useState(expense)
  const [receitasFiltradas, setReceitasFiltradas] = useState(revenue)
  const [date, setDate] = useState<Date>(startOfMonth(new Date()))

  // Ordenar o array pelo campo de data em ordem decrescente
  expense.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  useEffect(() => {
    const filteredDespesas = expense.filter(despesa => {
      const despesaDate = parseISO(despesa.created_at)
      return (
        despesaDate.getMonth() === date.getMonth() &&
        despesaDate.getFullYear() === date.getFullYear()
      )
    })
    const filteredRevenue = revenue.filter(revenue => {
      const revenueDate = parseISO(revenue.created_at)
      return (
        revenueDate.getMonth() === date.getMonth() &&
        revenueDate.getFullYear() === date.getFullYear()
      )
    })

    setReceitasFiltradas(filteredRevenue)
    setDespesasFiltradas(filteredDespesas)
  }, [date, expense, revenue])

  //faz a subitração da receita com a despesa
  const total =
    receitasFiltradas.reduce((sum, item) => sum + item.value, 0) -
    despesasFiltradas.reduce((sum, item) => sum + item.value, 0)

  // Exibir apenas os últimos 5 itens
  const lastFiveItems = despesasFiltradas.slice(0, 5)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => `R$ ${value}`}
                />
                <Bar
                  dataKey="total"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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
