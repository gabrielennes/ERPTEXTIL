import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Verificar autenticação
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      itens,
      subtotal,
      desconto,
      taxa,
      total,
      metodoPagamento,
      statusPagamento,
      paymentId,
      preferenceId,
    } = body

    // Validações
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: 'É necessário pelo menos um item na venda' },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Total inválido' },
        { status: 400 }
      )
    }

    if (!metodoPagamento) {
      return NextResponse.json(
        { error: 'Método de pagamento é obrigatório' },
        { status: 400 }
      )
    }

    // Criar venda com itens usando transação
    const venda = await prisma.$transaction(async (tx) => {
      // Criar venda
      const novaVenda = await tx.venda.create({
        data: {
          total: parseFloat(total),
          subtotal: parseFloat(subtotal || total),
          desconto: parseFloat(desconto || 0),
          taxa: parseFloat(taxa || 0),
          metodoPagamento,
          statusPagamento: statusPagamento || 'pending',
          paymentId: paymentId || null,
          preferenceId: preferenceId || null,
          userId: session.userId || null,
        },
      })

      // Criar itens da venda
      const itensVenda = await Promise.all(
        itens.map((item: any) =>
          tx.itensVenda.create({
            data: {
              vendaId: novaVenda.id,
              produtoId: item.produtoId,
              variacaoId: item.variacaoId || null,
              quantidade: parseInt(item.quantidade),
              precoUnitario: parseFloat(item.precoUnitario),
              subtotal: parseFloat(item.subtotal),
            },
          })
        )
      )

      // Atualizar estoque das variações (se houver)
      for (const item of itens) {
        if (item.variacaoId) {
          await tx.variacao.update({
            where: { id: item.variacaoId },
            data: {
              estoque: {
                decrement: parseInt(item.quantidade),
              },
            },
          })
        }
      }

      return {
        ...novaVenda,
        itens: itensVenda,
      }
    })

    return NextResponse.json(venda, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar venda:', error)
    return NextResponse.json(
      { error: 'Erro ao criar venda' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Verificar autenticação
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')  '50')
    const offset = parseInt(searchParams.get('offset')  '0')

    const vendas = await prisma.venda.findMany({
      take: limit,
      skip: offset,
      include: {
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const total = await prisma.venda.count()

    return NextResponse.json({
      vendas,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Erro ao buscar vendas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    )
  }
}