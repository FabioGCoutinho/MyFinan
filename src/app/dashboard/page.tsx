import { revalidateDashboard } from '@/components/actions'
import { Header } from '@/components/ui/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/util/supabase/server'
import { Expense } from './expense'
import { Overview } from './overview'
import { Relatorio } from './relatorio'
import { Revenue } from './revenue'
import { buildFinancialHistory } from './utils'

// ── Layout wrapper para evitar duplicação ──────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center min-h-dvh">
      <Header />
      <main className="flex flex-col lg:w-3/4 md:w-5/6 w-full space-y-4 p-2 md:p-8 pt-6">
        {children}
      </main>
    </div>
  )
}

// ── Busca de dados ─────────────────────────────────────

async function fetchFinancialData(userId: string) {
  const supabase = await createClient()

  const [revenueResult, expenseResult] = await Promise.all([
    supabase.from('revenue').select('*').eq('user_id', userId),
    supabase.from('expense').select('*').eq('user_id', userId),
  ])

  if (revenueResult.error) throw revenueResult.error
  if (expenseResult.error) throw expenseResult.error

  return {
    revenues: revenueResult.data ?? [],
    expenses: expenseResult.data ?? [],
  }
}

// ── Página ─────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error('No user found', userError)
    return (
      <PageShell>
        <p>Erro ao carregar dados do usuário</p>
      </PageShell>
    )
  }

  try {
    const { revenues, expenses } = await fetchFinancialData(user.id)
    const kpiUser = buildFinancialHistory(revenues, expenses)

    return (
      <PageShell>
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
            <Overview revenue={revenues} expense={expenses} kpiUser={kpiUser} />
          </TabsContent>
          <TabsContent value="expense" className="space-y-4">
            <Expense
              expense={expenses}
              onActionCompleted={revalidateDashboard}
            />
          </TabsContent>
          <TabsContent value="revenue" className="space-y-4">
            <Revenue
              revenue={revenues}
              onActionCompleted={revalidateDashboard}
            />
          </TabsContent>
          <TabsContent value="relatorio" className="space-y-4">
            <Relatorio revenue={revenues} expense={expenses} />
          </TabsContent>
        </Tabs>
      </PageShell>
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error(message)

    return (
      <PageShell>
        <p>Erro ao carregar dados financeiros</p>
      </PageShell>
    )
  }
}
