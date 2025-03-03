import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    'https://kzlifujmpgnasvchfpzh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlmdWptcGduYXN2Y2hmcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMzY0MjAsImV4cCI6MjA0MzgxMjQyMH0.wUzeee7YjhLVRRXdDTwg67Gpi59SmkAfRukbGrae8DU'
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
