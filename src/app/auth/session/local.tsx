'use client' // Linha necessária para Next.js 13+ indicar um client component
import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

interface SaveUserProps {
  user: User
}

export const SaveUserInfoClientComponent = ({ user }: SaveUserProps) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }

    redirect('/dashboard')
  }, [user])

  return null
}
