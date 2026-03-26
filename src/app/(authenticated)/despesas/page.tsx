import { revalidateDashboard } from '@/components/actions'
import { Button } from '@/components/ui/button'
import { createClient } from '@/util/supabase/server'
import Link from 'next/link'
import { Expense } from './expense'

export default async function DespesasPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error('No user found', userError)
    return <p>Erro ao carregar dados do usuário</p>
  }

  const [expenseResult, creditCardResult, creditCardExpenseResult] =
    await Promise.all([
      supabase.from('expense').select('*').eq('user_id', user.id),
      supabase.from('credit_card').select('*').eq('user_id', user.id),
      supabase.from('credit_card_expense').select('*').eq('user_id', user.id),
    ])

  if (expenseResult.error) {
    console.error(expenseResult.error)
    return <p>Erro ao carregar despesas</p>
  }

  return (
    <div className="flex flex-col xl:w-3/4 w-full mx-auto space-y-4">
      <Expense
        expense={expenseResult.data ?? []}
        creditCards={creditCardResult.data ?? []}
        creditCardExpenses={creditCardExpenseResult.data ?? []}
        onActionCompleted={revalidateDashboard}
      />
    </div>
  )
}
