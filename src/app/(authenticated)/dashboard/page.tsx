import { createClient } from '@/util/supabase/server'
import dynamic from 'next/dynamic'
import { buildFinancialHistory } from './utils'

const Overview = dynamic(() =>
  import('./overview').then(m => ({ default: m.Overview }))
)

// ── Busca de dados ─────────────────────────────────────

async function fetchFinancialData(userId: string) {
  const supabase = await createClient()

  const [
    revenueResult,
    expenseResult,
    creditCardResult,
    creditCardExpenseResult,
    invoicePaymentResult,
  ] = await Promise.all([
    supabase.from('revenue').select('*').eq('user_id', userId),
    supabase.from('expense').select('*').eq('user_id', userId),
    supabase.from('credit_card').select('*').eq('user_id', userId),
    supabase.from('credit_card_expense').select('*').eq('user_id', userId),
    supabase.from('invoice_payment').select('*').eq('user_id', userId),
  ])

  if (revenueResult.error) throw revenueResult.error
  if (expenseResult.error) throw expenseResult.error

  return {
    revenues: revenueResult.data ?? [],
    expenses: expenseResult.data ?? [],
    creditCards: creditCardResult.data ?? [],
    creditCardExpenses: creditCardExpenseResult.data ?? [],
    invoicePayments: invoicePaymentResult.data ?? [],
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
    return <p>Erro ao carregar dados do usuário</p>
  }

  try {
    const { revenues, expenses, creditCards, creditCardExpenses, invoicePayments } =
      await fetchFinancialData(user.id)
    
    // Filtra as despesas pagas para o gráfico
    const paidExpenses = expenses.filter(e => e.is_paid === true)

    const kpiUser = buildFinancialHistory(
      revenues,
      paidExpenses,
      creditCards,
      creditCardExpenses,
      invoicePayments
    )

    return (
      <div className="flex flex-col xl:w-3/4 w-full mx-auto space-y-4">
        <div className="w-full space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Overview
          revenue={revenues}
          expense={expenses}
          kpiUser={kpiUser}
          creditCards={creditCards}
          creditCardExpenses={creditCardExpenses}
          invoicePayments={invoicePayments}
        />
      </div>
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error(message)

    return <p>Erro ao carregar dados financeiros</p>
  }
}
