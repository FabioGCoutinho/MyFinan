import { revalidateDashboard } from '@/components/actions'
import { Header } from '@/components/ui/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/util/supabase/server'
import { Expense } from './expense'
import { Overview } from './overview'
import { Relatorio } from './relatorio'
import { Revenue } from './revenue'

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

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error('No user found', userError)
    return (
      <div className="flex flex-col items-center min-h-dvh">
        <Header />
        <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
          <p>Erro ao carregar dados do usuário</p>
        </main>
      </div>
    )
  }

  const getFinancialHistory = (
    allRevenues: { value: number; created_at: string }[],
    allExpenses: { value: number; created_at: string }[]
  ) => {
    // 1. Calcular a data de início (1º dia do mês, 12 meses atrás)
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1)
    const startDateISO = startDate.toISOString()

    // 2. Filtrar os dados pela data inicial (reutilizando dados já carregados)
    const revenues = allRevenues.filter(item => item.created_at >= startDateISO)
    const expenses = allExpenses.filter(item => item.created_at >= startDateISO)

    // 3. Função auxiliar para normalizar os dados
    // O objetivo é criar um array unificado que o gráfico entenda facilmente
    const processHistory = (
      revenues: { value: number; created_at: string }[],
      expenses: { value: number; created_at: string }[]
    ) => {
      const historyMap = new Map()

      // A. Gerar as chaves para os últimos 12 meses (garante que meses zerados apareçam)
      for (let i = 0; i < 12; i++) {
        // Começa 11 meses atrás e vai até o mês atual
        const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)

        const year = d.getFullYear()
        const monthIndex = d.getMonth() // 0 a 11

        // Chave única para agrupar (ex: "2024-0")
        const key = `${year}-${monthIndex}`

        // Nome do mês em PT-BR (ex: "Jan")
        const monthName = new Intl.DateTimeFormat('pt-BR', {
          month: 'short',
        }).format(d)

        const formattedDate = `${String(monthIndex + 1).padStart(2, '0')}/${year}`

        // Inicializa o objeto zerado
        historyMap.set(key, {
          month: capitalizeFirstLetter(monthName), // "Jan"
          monthIndex: monthIndex + 1, // 1 (numérico)
          year: year, // 2024
          dateLabel: formattedDate,
          revenue: 0,
          expense: 0,
          fullDate: d, // útil se precisar ordenar ou formatar depois
        })
      }

      // B. Somar Receitas
      for (const item of revenues) {
        const d = new Date(item.created_at)
        const key = `${d.getFullYear()}-${d.getMonth()}`

        if (historyMap.has(key)) {
          const current = historyMap.get(key)
          current.revenue += Number(item.value)
        }
      }

      // C. Somar Despesas
      for (const item of expenses) {
        const d = new Date(item.created_at)
        const key = `${d.getFullYear()}-${d.getMonth()}`

        if (historyMap.has(key)) {
          const current = historyMap.get(key)
          current.expense += Number(item.value)
        }
      }

      // D. Retornar array ordenado cronologicamente
      return Array.from(historyMap.values())
    }

    return processHistory(revenues, expenses)
  }

  // Pequeno helper para deixar "jan" como "Jan"
  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  try {
    const [revenueData, expenseData] = await Promise.all([
      supabase.from('revenue').select('*').eq('user_id', user.id),
      supabase.from('expense').select('*').eq('user_id', user.id),
    ])

    if (revenueData.error) throw revenueData.error
    if (expenseData.error) throw expenseData.error

    const data = {
      revenueData: revenueData.data || [],
      expenseData: expenseData.data || [],
    }

    const kpiUser = getFinancialHistory(data.revenueData, data.expenseData)

    return (
      <div className="flex flex-col items-center min-h-dvh">
        <Header />
        <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
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
              <Overview
                revenue={data.revenueData}
                expense={data.expenseData}
                kpiUser={kpiUser}
              />
            </TabsContent>
            <TabsContent value="expense" className="space-y-4">
              <Expense
                expense={data.expenseData}
                onActionCompleted={revalidateDashboard}
              />
            </TabsContent>
            <TabsContent value="revenue" className="space-y-4">
              <Revenue
                revenue={data.revenueData}
                onActionCompleted={revalidateDashboard}
              />
            </TabsContent>
            <TabsContent value="relatorio" className="space-y-4">
              <Relatorio
                revenue={data.revenueData}
                expense={data.expenseData}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error('An unknown error occurred')
    }
    return (
      <div className="flex flex-col items-center min-h-dvh">
        <Header />
        <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
          <p>Erro ao carregar dados financeiros</p>
        </main>
      </div>
    )
  }
}
