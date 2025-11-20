import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET - Listar vendas
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const limitNum = limit ? parseInt(limit) : undefined

    const vendas = await prisma.venda.findMany({
      include: {
        itens: {
          include: {
            variacao: {
              include: {
                produto: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum,
    })

    return NextResponse.json(vendas)
  } catch (error) {
    console.error('Erro ao buscar vendas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    )
  }
}

// POST - Criar venda
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { itens } = body

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: 'É necessário pelo menos um item na venda' },
        { status: 400 }
      )
    }

    // Calcular total e validar itens
    let total = 0
    const itensValidados = []

    for (const item of itens) {
      if (!item.variacaoId || !item.quantidade || !item.precoUnitario) {
        return NextResponse.json(
          { error: 'Dados do item inválidos' },
          { status: 400 }
        )
      }

      // Buscar variação para validar estoque e obter nome do produto
      const variacao = await prisma.variacao.findUnique({
        where: { id: item.variacaoId },
        include: { produto: true },
      })

      if (!variacao) {
        return NextResponse.json(
          { error: `Variação ${item.variacaoId} não encontrada` },
          { status: 404 }
        )
      }

      if (variacao.estoque < item.quantidade) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${variacao.produto.nome}` },
          { status: 400 }
        )
      }

      const subtotal = item.precoUnitario * item.quantidade
      total += subtotal

      itensValidados.push({
        variacaoId: item.variacaoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal,
        produtoNome: variacao.produto.nome,
      })
    }

    // Gerar número da venda
    const count = await prisma.venda.count()
    const numero = `VENDA-${String(count + 1).padStart(6, '0')}`

    // Criar venda e itens em uma transação
    const venda = await prisma.$transaction(async (tx) => {
      // Criar venda
      const novaVenda = await tx.venda.create({
        data: {
          numero,
          total,
          itens: {
            create: itensValidados,
          },
        },
        include: {
          itens: {
            include: {
              variacao: {
                include: {
                  produto: true,
                },
              },
            },
          },
        },
      })

      // Atualizar estoque
      for (const item of itensValidados) {
        await tx.variacao.update({
          where: { id: item.variacaoId },
          data: {
            estoque: {
              decrement: item.quantidade,
            },
          },
        })
      }

      return novaVenda
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

