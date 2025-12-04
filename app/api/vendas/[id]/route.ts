import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticação
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { statusPagamento, paymentId, preferenceId, parcelas } = body

    // Atualizar apenas os campos fornecidos
    const updateData: any = {}
    if (statusPagamento) {
      updateData.statusPagamento = statusPagamento
    }
    if (paymentId) {
      updateData.paymentId = paymentId
    }
    if (preferenceId) {
      updateData.preferenceId = preferenceId
    }
    if (typeof parcelas === 'number') {
      updateData.parcelas = parcelas
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    const venda = await prisma.venda.update({
      where: { id },
      data: updateData,
      include: {
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
    })

    return NextResponse.json(venda)
  } catch (error: any) {
    console.error('Erro ao atualizar venda:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar venda' },
      { status: 500 }
    )
  }
}

