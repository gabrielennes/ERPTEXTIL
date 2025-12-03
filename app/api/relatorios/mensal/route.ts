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
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    inicioMes.setHours(0, 0, 0, 0)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    fimMes.setHours(23, 59, 59, 999)

    // Buscar todas as vendas do mês
    const vendas = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: inicioMes,
          lte: fimMes,
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

    // Faturamento do mês
    const faturamento = vendas.reduce((acc, v) => acc + v.total, 0)
    const totalVendas = vendas.length

    // Buscar vendas do mês anterior
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    inicioMesAnterior.setHours(0, 0, 0, 0)
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    fimMesAnterior.setHours(23, 59, 59, 999)

    const vendasMesAnterior = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior,
        },
        statusPagamento: 'approved',
      },
    })

    const faturamentoMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + v.total, 0)
    const diferenca = faturamento - faturamentoMesAnterior
    const percentualVariacao = faturamentoMesAnterior > 0 
      ? ((diferenca / faturamentoMesAnterior) * 100) 
      : (faturamento > 0 ? 100 : 0)

    // Produtos mais vendidos
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

    const produtosMaisVendidos = Object.values(produtosVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    // Curva ABC
    const produtosABC = Object.values(produtosVendidos)
      .sort((a, b) => b.total - a.total)
      .map((produto, index, array) => {
        const totalGeral = array.reduce((sum, p) => sum + p.total, 0)
        const percentual = (produto.total / totalGeral) * 100
        const percentualAcumulado = array
          .slice(0, index + 1)
          .reduce((sum, p) => sum + (p.total / totalGeral) * 100, 0)
        
        let classificacao = 'C'
        if (percentualAcumulado <= 80) {
          classificacao = 'A'
        } else if (percentualAcumulado <= 95) {
          classificacao = 'B'
        }

        return {
          ...produto,
          percentual,
          percentualAcumulado,
          classificacao,
        }
      })

    const curvaA = produtosABC.filter(p => p.classificacao === 'A')
    const curvaB = produtosABC.filter(p => p.classificacao === 'B')
    const curvaC = produtosABC.filter(p => p.classificacao === 'C')

    return NextResponse.json({
      faturamento,
      faturamentoMesAnterior,
      diferenca,
      percentualVariacao,
      totalVendas,
      produtosMaisVendidos,
      curvaABC: {
        produtos: produtosABC,
        resumo: {
          classeA: {
            quantidade: curvaA.length,
            percentual: curvaA.reduce((sum, p) => sum + p.percentual, 0),
            faturamento: curvaA.reduce((sum, p) => sum + p.total, 0),
          },
          classeB: {
            quantidade: curvaB.length,
            percentual: curvaB.reduce((sum, p) => sum + p.percentual, 0),
            faturamento: curvaB.reduce((sum, p) => sum + p.total, 0),
          },
          classeC: {
            quantidade: curvaC.length,
            percentual: curvaC.reduce((sum, p) => sum + p.percentual, 0),
            faturamento: curvaC.reduce((sum, p) => sum + p.total, 0),
          },
        },
      },
      periodo: {
        inicio: inicioMes.toISOString(),
        fim: fimMes.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar relatório mensal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatório mensal' },
      { status: 500 }
    )
  }
}

