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
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mes' // dia, semana, mes, ano

    const hoje = new Date()
    let inicio: Date
    let fim: Date = new Date(hoje)
    fim.setHours(23, 59, 59, 999)

    switch (periodo) {
      case 'dia':
        inicio = new Date(hoje)
        inicio.setHours(0, 0, 0, 0)
        break
      case 'semana':
        const diaSemana = hoje.getDay()
        const diasAteDomingo = diaSemana === 0 ? 0 : diaSemana
        inicio = new Date(hoje)
        inicio.setDate(hoje.getDate() - diasAteDomingo)
        inicio.setHours(0, 0, 0, 0)
        break
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        inicio.setHours(0, 0, 0, 0)
        break
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1)
        inicio.setHours(0, 0, 0, 0)
        break
      default:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        inicio.setHours(0, 0, 0, 0)
    }

    // Buscar vendas do período
    const vendas = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: inicio,
          lte: fim,
        },
        statusPagamento: 'approved',
      },
    })

    // Total por forma de pagamento
    const totalPorPagamento: { [key: string]: number } = {}
    vendas.forEach(venda => {
      const metodo = venda.metodoPagamento
      totalPorPagamento[metodo] = (totalPorPagamento[metodo] || 0) + venda.total
    })

    // Taxa estimada das máquininhas (assumindo 3.99% para cartão)
    const taxaCartao = 0.0399
    const totalCartao = totalPorPagamento['cartao'] || 0
    const taxaEstimada = totalCartao * taxaCartao

    // Total líquido (bruto - taxas)
    const totalBruto = vendas.reduce((acc, v) => acc + v.total, 0)
    const totalLiquido = totalBruto - taxaEstimada

    // Resumo por período (últimos 12 meses)
    const resumoMensal: { [key: string]: { mes: string; total: number; taxas: number; liquido: number } } = {}
    
    for (let i = 11; i >= 0; i--) {
      const dataRef = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mesKey = `${dataRef.getFullYear()}-${String(dataRef.getMonth() + 1).padStart(2, '0')}`
      const mesNome = dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      const inicioMes = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1)
      inicioMes.setHours(0, 0, 0, 0)
      const fimMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0)
      fimMes.setHours(23, 59, 59, 999)

      const vendasMes = await prisma.venda.findMany({
        where: {
          createdAt: {
            gte: inicioMes,
            lte: fimMes,
          },
          statusPagamento: 'approved',
        },
      })

      const totalMes = vendasMes.reduce((acc, v) => acc + v.total, 0)
      const cartaoMes = vendasMes.filter(v => v.metodoPagamento === 'cartao').reduce((acc, v) => acc + v.total, 0)
      const taxasMes = cartaoMes * taxaCartao
      const liquidoMes = totalMes - taxasMes

      resumoMensal[mesKey] = {
        mes: mesNome,
        total: totalMes,
        taxas: taxasMes,
        liquido: liquidoMes,
      }
    }

    return NextResponse.json({
      totalPorPagamento,
      taxaEstimada,
      totalBruto,
      totalLiquido,
      resumoMensal: Object.values(resumoMensal),
      periodo: {
        tipo: periodo,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar relatório financeiro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar relatório financeiro' },
      { status: 500 }
    )
  }
}

