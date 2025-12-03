import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const hoje = new Date()
    const inicioDia = new Date(hoje)
    inicioDia.setHours(0, 0, 0, 0)
    const fimDia = new Date(hoje)
    fimDia.setHours(23, 59, 59, 999)

    // Buscar todas as vendas do dia
    const vendas = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: inicioDia,
          lte: fimDia,
        },
        statusPagamento: 'approved',
      },
      include: {
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
    })

    // Calcular totais
    const totalVendido = vendas.reduce((acc, v) => acc + v.total, 0)
    const totalItens = vendas.reduce((acc, v) => acc + v.itens.reduce((sum, i) => sum + i.quantidade, 0), 0)
    const ticketMedio = vendas.length > 0 ? totalVendido / vendas.length : 0

    // Produto mais vendido
    const produtosVendidos: { [key: string]: { nome: string; quantidade: number; total: number } } = {}
    vendas.forEach(venda => {
      venda.itens.forEach(item => {
        const produtoId = item.produto.id
        if (!produtosVendidos[produtoId]) {
          produtosVendidos[produtoId] = {
            nome: item.produto.nome,
            quantidade: 0,
            total: 0,
          }
        }
        produtosVendidos[produtoId].quantidade += item.quantidade
        produtosVendidos[produtoId].total += item.subtotal
      })
    })

    const produtoMaisVendido = Object.values(produtosVendidos).sort((a, b) => b.quantidade - a.quantidade)[0] || null

    // Top 10 produtos mais vendidos
    const top10Produtos = Object.values(produtosVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    // Vendas por hora do dia
    const vendasPorHora: { [key: number]: number } = {}
    for (let i = 0; i < 24; i++) {
      vendasPorHora[i] = 0
    }

    vendas.forEach(venda => {
      const hora = new Date(venda.createdAt).getHours()
      vendasPorHora[hora] = (vendasPorHora[hora] || 0) + venda.total
    })

    // Total por forma de pagamento
    const totalPorPagamento: { [key: string]: number } = {}
    vendas.forEach(venda => {
      const metodo = venda.metodoPagamento
      totalPorPagamento[metodo] = (totalPorPagamento[metodo] || 0) + venda.total
    })

    return NextResponse.json({
      totalVendido,
      totalItens,
      ticketMedio,
      produtoMaisVendido,
      top10Produtos,
      vendasPorHora,
      totalPorPagamento,
      totalVendas: vendas.length,
    })
  } catch (error) {
    console.error('Erro ao buscar relatório diário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatório diário' },
      { status: 500 }
    )
  }
}

