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

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`
  const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-31`

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
              <Overview revenue={data.revenueData} expense={data.expenseData} />
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
