'use client'

import { Download } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/ui/header'
import { useEffect, useState } from 'react'
import { supabase } from '@/util/supabase/server'
import { Overview } from './overview'
import { Expense } from './expense'
import { Revenue } from './revenue'

interface revenueProps {
  category: string
  created_at: string
  id: number
  obs: string
  revenue: string
  updated_at: Date
  value: number
  cat_revenue: {
    id: number
    category: string
    created_at: Date
  }
}

interface expenseProps {
  category: string
  created_at: string
  id: number
  obs: string
  expense: string
  updated_at: Date
  value: number
  cat_expense: {
    id: number
    category: string
    created_at: Date
  }
}

export default function DashboardPage() {
  const [revenue, setRevenue] = useState<revenueProps[]>([])
  const [expense, setExpense] = useState<expenseProps[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchRevenue() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // getMonth() retorna um valor de 0 a 11

      const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`
      const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-31`

      try {
        const [revenueData, expenseData] = await Promise.all([
          supabase
            .from('revenue')
            .select('*, cat_revenue (id, category)')
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth),
          supabase
            .from('expense')
            .select('*, cat_expense (id, category)')
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth),
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
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Painel</h2>
          <div className="flex items-center space-x-2">
            <Button className="text-white">
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="expense">Despesas</TabsTrigger>
            <TabsTrigger value="revenue">Receitas</TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notificações
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Overview revenue={revenue} expense={expense} />
          </TabsContent>
          <TabsContent value="expense" className="space-y-4">
            <Expense expense={expense} />
          </TabsContent>
          <TabsContent value="revenue" className="space-y-4">
            <Revenue revenue={revenue} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
