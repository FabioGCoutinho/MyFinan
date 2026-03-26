import { createClient } from '@/util/supabase/server'
import dynamic from 'next/dynamic'
import { buildFinancialHistory } from '../dashboard/utils'

const Relatorio = dynamic(() =>
  import('./relatorio').then(m => ({ default: m.Relatorio }))
)

export default async function RelatorioPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error('No user found', userError)
    return <p>Erro ao carregar dados do usuário</p>
  }

  const [
    revenueResult,
    expenseResult,
    creditCardResult,
    creditCardExpenseResult,
  ] = await Promise.all([
    supabase.from('revenue').select('*').eq('user_id', user.id),
    supabase.from('expense').select('*').eq('user_id', user.id),
    supabase.from('credit_card').select('*').eq('user_id', user.id),
    supabase.from('credit_card_expense').select('*').eq('user_id', user.id),
  ])

  if (revenueResult.error || expenseResult.error) {
    console.error(revenueResult.error || expenseResult.error)
    return <p>Erro ao carregar dados financeiros</p>
  }

  const kpiUser = buildFinancialHistory(
    revenueResult.data ?? [],
    expenseResult.data ?? [],
    creditCardResult.data ?? [],
    creditCardExpenseResult.data ?? []
  )

  return (
    <div className="flex flex-col xl:w-3/4 w-full mx-auto space-y-4">
      <div className="w-full space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatório</h2>
      </div>
      <Relatorio kpiUser={kpiUser} />
    </div>
  )
}
