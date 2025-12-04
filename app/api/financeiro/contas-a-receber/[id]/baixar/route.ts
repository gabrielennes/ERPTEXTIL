import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params

    if (!prisma.contasAReceber) {
      return NextResponse.json(
        { error: 'Modelo ContasAReceber não encontrado. Execute "npx prisma generate" e reinicie o servidor.' },
        { status: 500 }
      )
    }

    // Atualizar conta para dar baixa
    const conta = await prisma.contasAReceber.update({
      where: { id },
      data: {
        baixada: true,
        dataBaixa: new Date(),
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json({
      success: true,
      conta,
      message: 'Conta a receber dada baixa com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao dar baixa na conta a receber:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Conta a receber não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao dar baixa na conta a receber' },
      { status: 500 }
    )
  }
}

