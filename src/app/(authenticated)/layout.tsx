import { Header } from '@/components/ui/header'
import { Sidebar } from '@/components/ui/sidebar'
import { createClient } from '@/util/supabase/server'

export default async function AuthenticatedLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userInfo = user
    ? {
        displayName:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Usuário',
        email: user.email || '',
        avatarUrl:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      }
    : null

  return (
    <div className="flex min-h-dvh">
      <Sidebar userInfo={userInfo} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-2 md:p-8 pt-6">{children}</main>
      </div>
    </div>
  )
}
