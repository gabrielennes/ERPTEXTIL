import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
      parcelas,
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

    const gerarNumeroVenda = async (tx: Prisma.TransactionClient) => {
      const agora = new Date()
      const ano = agora.getFullYear()
      const mes = String(agora.getMonth() + 1).padStart(2, '0')
      const dia = String(agora.getDate()).padStart(2, '0')
      const prefixo = `${ano}${mes}${dia}`

      const ultimaVendaDia = await tx.venda.findFirst({
        where: {
          numero: {
            startsWith: prefixo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          numero: true,
        },
      })

      let sequencia = 1
      if (ultimaVendaDia?.numero) {
        const partes = ultimaVendaDia.numero.split('-')
        const ultimaParte = partes[partes.length - 1]
        const numeroSequencial = parseInt(ultimaParte, 10)
        if (!isNaN(numeroSequencial)) {
          sequencia = numeroSequencial + 1
        }
      }

      return `${prefixo}-${sequencia.toString().padStart(3, '0')}`
    }

    // Criar venda com itens usando transação
    const numeroParcelas =
      typeof parcelas === 'number' && parcelas > 0 ? Math.floor(parcelas) : 1

    const venda = await prisma.$transaction(async (tx) => {
      const numeroVenda = await gerarNumeroVenda(tx)

      // Criar venda
      const novaVenda = await tx.venda.create({
        data: {
          numero: numeroVenda,
          total: parseFloat(total),
          subtotal: parseFloat(subtotal || total),
          desconto: parseFloat(desconto || 0),
          taxa: parseFloat(taxa || 0),
          metodoPagamento,
          statusPagamento: statusPagamento || 'pending',
          paymentId: paymentId || null,
          preferenceId: preferenceId || null,
          userId: null,
          parcelas: numeroParcelas,
          dataVenda: new Date(),
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const dataInicial = searchParams.get('dataInicial')
    const dataFinal = searchParams.get('dataFinal')

    // Construir filtro de data
    const where: any = {}
    if (dataInicial || dataFinal) {
      where.createdAt = {}
      if (dataInicial) {
        // Início do dia (00:00:00)
        const inicio = new Date(dataInicial)
        inicio.setHours(0, 0, 0, 0)
        where.createdAt.gte = inicio
      }
      if (dataFinal) {
        // Fim do dia (23:59:59)
        const fim = new Date(dataFinal)
        fim.setHours(23, 59, 59, 999)
        where.createdAt.lte = fim
      }
    }

    const vendas = await prisma.venda.findMany({
      where,
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

    const total = await prisma.venda.count({ where })

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

