'use server'

// app/page.tsx
import { cookies } from 'next/headers'

export async function Cookies() {
  // Obter todos os cookies
  const allCookies = cookies().getAll()

  // Exemplo de como acessar um cookie específico
  const token = cookies().get('sb-access-token')

  // Lógica adicional com os cookies
  console.log('All cookies:', allCookies)
  console.log('Token:', token?.value)

  // Passar os dados para o componente cliente
  return allCookies
}
