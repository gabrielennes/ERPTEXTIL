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
    const diaSemana = hoje.getDay() // 0 = domingo, 6 = sábado
    const diasAteDomingo = diaSemana === 0 ? 0 : diaSemana
    const diasAteSabado = 6 - diaSemana

    // Início da semana atual (domingo)
    const inicioSemanaAtual = new Date(hoje)
    inicioSemanaAtual.setDate(hoje.getDate() - diasAteDomingo)
    inicioSemanaAtual.setHours(0, 0, 0, 0)

    // Fim da semana atual (sábado)
    const fimSemanaAtual = new Date(hoje)
    fimSemanaAtual.setDate(hoje.getDate() + diasAteSabado)
    fimSemanaAtual.setHours(23, 59, 59, 999)

    // Início da semana anterior
    const inicioSemanaAnterior = new Date(inicioSemanaAtual)
    inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7)

    // Fim da semana anterior
    const fimSemanaAnterior = new Date(fimSemanaAtual)
    fimSemanaAnterior.setDate(fimSemanaAnterior.getDate() - 7)

    // Vendas da semana atual
    const vendasSemanaAtual = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: inicioSemanaAtual,
          lte: fimSemanaAtual,
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

    // Vendas da semana anterior
    const vendasSemanaAnterior = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: inicioSemanaAnterior,
          lte: fimSemanaAnterior,
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

    // Total faturado da semana atual
    const totalFaturado = vendasSemanaAtual.reduce((acc, v) => acc + v.total, 0)

    // Total faturado da semana anterior
    const totalSemanaAnterior = vendasSemanaAnterior.reduce((acc, v) => acc + v.total, 0)

    // Comparação
    const diferenca = totalFaturado - totalSemanaAnterior
    const percentualVariacao = totalSemanaAnterior > 0 
      ? ((diferenca / totalSemanaAnterior) * 100) 
      : 0

    // Ranking dos 10 SKUs mais vendidos
    const skusVendidos: { [key: string]: { sku: string; nome: string; quantidade: number; total: number } } = {}
    
    vendasSemanaAtual.forEach(venda => {
      venda.itens.forEach(item => {
        const sku = item.variacao?.sku || `PROD-${item.produto.id.slice(-6)}`
        if (!skusVendidos[sku]) {
          skusVendidos[sku] = {
            sku,
            nome: item.produto.nome,
            quantidade: 0,
            total: 0,
          }
        }
        skusVendidos[sku].quantidade += item.quantidade
        skusVendidos[sku].total += item.subtotal
      })
    })

    const rankingSKUs = Object.values(skusVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    return NextResponse.json({
      totalFaturado,
      totalSemanaAnterior,
      diferenca,
      percentualVariacao,
      rankingSKUs,
      periodo: {
        inicio: inicioSemanaAtual.toISOString(),
        fim: fimSemanaAtual.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar relatório semanal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatório semanal' },
      { status: 500 }
    )
  }
}

