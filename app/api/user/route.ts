import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const session = cookies().get('session')?.value

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    try {
      const sessionData = JSON.parse(
        Buffer.from(session, 'base64').toString()
      )

      return NextResponse.json({
        email: sessionData.email || 'Usuário',
        role: sessionData.role || 'user',
        name: sessionData.name || null,
      })
    } catch (e) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar informações do usuário' },
      { status: 500 }
    )
  }
}

















