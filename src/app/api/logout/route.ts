// app/api/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Excluir todos os cookies
  const response = NextResponse.json({
    message: 'Cookies cleared successfully',
  })
  response.cookies.set('PHPSESSID', '', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: new Date(0),
  })
  response.cookies.set('sb-access-token', '', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: new Date(0),
  })
  // Adicione outros cookies que você deseja excluir aqui

  return response
}
