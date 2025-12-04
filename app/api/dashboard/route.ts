import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    // KPIs básicos - garantir que está contando todos os registros
    const totalProdutos = await prisma.produto.count({})
    const totalVariacoes = await prisma.variacao.count({})
    
    // Log para debug (pode remover depois)
    console.log('Dashboard KPIs:', { totalProdutos, totalVariacoes })

    // Data atual
    const hoje = new Date()
    const hojeInicio = new Date(hoje)
    hojeInicio.setHours(0, 0, 0, 0)

    const whereAprovadas = {
      statusPagamento: 'approved' as const,
    }

    // Vendas de hoje (apenas aprovadas)
    const vendasHoje = await prisma.venda.findMany({
      where: {
        ...whereAprovadas,
        createdAt: {
          gte: hojeInicio,
        },
      },
    })

    const totalVendasHoje = vendasHoje.reduce((acc, v) => acc + v.total, 0)

    const todasVendas = await prisma.venda.findMany({
      where: whereAprovadas,
    })
    const totalVendas = todasVendas.reduce((acc, v) => acc + v.total, 0)

    // Vendas do mês atual
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    inicioMes.setHours(0, 0, 0, 0)
    
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    fimMes.setHours(23, 59, 59, 999)

    const vendasMes = await prisma.venda.findMany({
      where: {
        ...whereAprovadas,
        createdAt: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Agrupar vendas por dia do mês (garantindo que seja do mês atual)
    const vendasPorDia: { [key: number]: number } = {}
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    
    vendasMes.forEach((venda) => {
      const dataVenda = new Date(venda.createdAt)
      // Verificar se a venda é realmente do mês atual
      if (dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual) {
        const dia = dataVenda.getDate()
        vendasPorDia[dia] = (vendasPorDia[dia] || 0) + venda.total
      }
    })

    // Ticket médio
    const quantidadeVendas = todasVendas.length
    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0

    // Produtos com estoque baixo (<= 5)
    const produtosEstoqueBaixo = await prisma.variacao.findMany({
      where: {
        estoque: {
          lte: 5,
        },
      },
      include: {
        produto: true,
      },
      orderBy: {
        estoque: 'asc',
      },
    })

    // Últimas 5 vendas
    const ultimasVendas = await prisma.venda.findMany({
      where: whereAprovadas,
      include: {
        itens: {
          include: {
            produto: true,
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
      take: 5,
    })

    return NextResponse.json({
      kpis: {
        totalProdutos,
        totalVariacoes,
        vendasHoje: totalVendasHoje,
        totalVendas,
        quantidadeVendas,
        ticketMedio,
      },
      vendasPorDia,
      produtosEstoqueBaixo: produtosEstoqueBaixo.map((v) => ({
        id: v.id,
        sku: v.sku,
        produtoNome: v.produto.nome,
        estoque: v.estoque,
        tamanho: v.tamanho,
        cor: v.cor,
      })),
      ultimasVendas: ultimasVendas.map((v) => ({
        id: v.id,
        numero: (v as any).numero || v.id,
        total: v.total,
        parcelas: (v as any).parcelas ?? 1,
        data: (v as any).dataVenda ? (v as any).dataVenda.toISOString() : v.createdAt.toISOString(),
        produtos: v.itens.map((i) => ({
          nome: i.produto?.nome || i.variacao?.produto?.nome || 'Produto',
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        })),
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}

