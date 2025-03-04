'use client'

import { useEffect, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/ui/header'
import { supabase } from '@/util/supabase/supabase'
import { Overview } from './overview'
import { Expense } from './expense'
import { Revenue } from './revenue'
import { Relatorio } from './relatorio'

interface revenueProps {
  category: string
  created_at: string
  id: number
  obs: string
  revenue: string
  updated_at: Date
  value: number
}

interface expenseProps {
  category: string
  created_at: string
  id: number
  obs: string
  expense: string
  updated_at: Date
  value: number
}

export default function DashboardPage() {
  const [revenue, setRevenue] = useState<revenueProps[]>([])
  const [expense, setExpense] = useState<expenseProps[]>([])
  const [revenueError, setError] = useState('')
  const [reloadData, setReloadData] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const a = localStorage.getItem('user')
    const user = a ? JSON.parse(a) : null

    async function fetchRevenue() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // getMonth() retorna um valor de 0 a 11

      const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`
      const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-31`

      try {
        const [revenueData, expenseData] = await Promise.all([
          supabase.from('revenue').select('*').eq('user_id', user.id),
          // .gte('created_at', startOfMonth)
          // .lte('created_at', endOfMonth),
          supabase
            .from('expense')
            .select('*')
            .eq('user_id', user.id),
          // .gte('created_at', startOfMonth)
          // .lte('created_at', endOfMonth),
        ])

        if (revenueData.error) throw revenueData.error
        setRevenue(revenueData.data)

        if (expenseData.error) throw expenseData.error
        setExpense(expenseData.data)
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unknown error occurred')
        }
      }
    }

    fetchRevenue()
  }, [reloadData])

  return (
    <div className="flex flex-col items-center min-h-dvh">
      <Header />
      <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-8 pt-6">
        <div className="w-full space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Painel</h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="revenue">Receitas</TabsTrigger>
            <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Overview revenue={revenue} expense={expense} />
          </TabsContent>
          <TabsContent value="expense" className="space-y-4">
            <Expense
              expense={expense}
              onActionCompleted={() => setReloadData(!reloadData)}
            />
          </TabsContent>
          <TabsContent value="revenue" className="space-y-4">
            <Revenue
              revenue={revenue}
              onActionCompleted={() => setReloadData(!reloadData)}
            />
          </TabsContent>
          <TabsContent value="relatorio" className="space-y-4">
            <Relatorio revenue={revenue} expense={expense} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
