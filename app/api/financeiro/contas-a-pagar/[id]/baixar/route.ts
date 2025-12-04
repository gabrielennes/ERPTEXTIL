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

    if (!prisma.contasAPagar) {
      return NextResponse.json(
        { error: 'Modelo ContasAPagar não encontrado. Execute "npx prisma generate" e reinicie o servidor.' },
        { status: 500 }
      )
    }

    // Atualizar conta para dar baixa
    const conta = await prisma.contasAPagar.update({
      where: { id },
      data: {
        baixada: true,
        dataBaixa: new Date(),
      },
      include: {
        fornecedor: true,
      },
    })

    return NextResponse.json({
      success: true,
      conta,
      message: 'Conta a pagar dada baixa com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao dar baixa na conta a pagar:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Conta a pagar não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao dar baixa na conta a pagar' },
      { status: 500 }
    )
  }
}

