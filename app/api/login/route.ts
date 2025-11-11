import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 }
      )
    }

    const sessionData = {
      email: user.email,
      role: user.role,
      name: user.name,
    }

    const response = NextResponse.json({ 
      ok: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      }
    })

    response.cookies.set(
      'session',
      Buffer.from(JSON.stringify(sessionData)).toString('base64'),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      }
    )

    return response
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


