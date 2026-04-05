import { revalidateDashboard } from '@/components/actions'
import { createClient } from '@/util/supabase/server'
import { Revenue } from './revenue'

export default async function ReceitasPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error('No user found', userError)
    return <p>Erro ao carregar dados do usuário</p>
  }

  const { data: revenueData, error: revenueError } = await supabase
    .from('revenue')
    .select('*')
    .eq('user_id', user.id)

  if (revenueError) {
    console.error(revenueError)
    return <p>Erro ao carregar receitas</p>
  }

  return (
    <div className="flex flex-col xl:w-3/4 w-full mx-auto space-y-4">
      <Revenue
        revenue={revenueData ?? []}
        onActionCompleted={revalidateDashboard}
      />
    </div>
  )
}
