import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    // Data de cadastro: 19/11/2025
    const dataCadastro = new Date(2025, 10, 19) // Mês é 0-indexed, então 10 = novembro

    // Atualizar todos os produtos
    const result = await prisma.produto.updateMany({
      data: {
        createdAt: dataCadastro,
      },
    })

    return NextResponse.json({
      message: `Atualizados ${result.count} produtos com data de cadastro 19/11/2025`,
      count: result.count,
    })
  } catch (error) {
    console.error('Erro ao atualizar datas dos produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar datas dos produtos' },
      { status: 500 }
    )
  }
}

