'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/util/supabase/server'

interface loginProps {
  email: string
  password: string
}

export async function login({ email, password }: loginProps) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: email,
    password: password,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://app.myfinan.com.br/auth/callback',
    },
  })

  if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
}

export async function signup({ email, password }: loginProps) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email,
    password,
  }

  const {
    error,
    data: { user },
  } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/auth/session')
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
  } else {
    console.log('User signed out successfully')
  }

  // Chamar a API route para excluir cookies no lado do servidor
  // await fetch('/api/logout', {
  //   method: 'POST',
  // })

  // Excluir cookies no lado do cliente
  // document.cookie =
  //   'PHPSESSID=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  // document.cookie =
  //   'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  // Adicione outros cookies que você deseja excluir aqui

  // Revalidar o caminho e redirecionar o usuário
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function revalidateDashboard() {
  revalidatePath('/dashboard', 'page')
}

export async function revalidateAfterInsert() {
  revalidatePath('/dashboard', 'page')
}
