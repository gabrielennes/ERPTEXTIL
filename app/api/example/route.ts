import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Exemplo de uso do Prisma
    // Descomente quando tiver modelos criados
    // const users = await prisma.user.findMany()
    
    return NextResponse.json({
      message: 'Exemplo de API route',
      // data: users,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}

