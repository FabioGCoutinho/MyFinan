import { createClient } from '@/util/supabase/server'
import { SaveUserInfoClientComponent } from './local'

export default async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Error fetching user data:', error.message)
    return null
  }

  if (!user) {
    console.error('No user found')
    return null
  }

  return (
    <div>
      <SaveUserInfoClientComponent user={user} />
    </div>
  )
}
