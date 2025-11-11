import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  // Deletar o cookie de sessão com configurações explícitas (mesmas do login)
  response.cookies.set('session', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  return response
}






