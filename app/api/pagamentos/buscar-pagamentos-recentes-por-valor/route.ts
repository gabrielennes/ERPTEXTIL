import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { prisma } from '@/lib/prisma'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const payment = new Payment(client)

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
    const { vendaId, valor, preferenceId } = body

    if (!vendaId) {
      return NextResponse.json(
        { error: 'vendaId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a venda
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
    })

    if (!venda) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    const valorVenda = valor || venda.total
    const dataVenda = new Date(venda.createdAt)
    
    // Buscar pagamentos criados nas últimas 2 horas
    // A API do Mercado Pago permite buscar pagamentos usando search
    // Vamos buscar pagamentos criados após a criação da venda
    
    console.log('🔍 Buscando pagamentos recentes para venda:', {
      vendaId,
      valorVenda,
      dataVenda: dataVenda.toISOString(),
    })

    // A API do Mercado Pago não tem um endpoint direto para buscar por metadata ou valor
    // Mas podemos usar a API de search com filtros de data
    // Por enquanto, vamos tentar uma abordagem diferente:
    // Buscar pagamentos que foram criados após a venda e verificar manualmente
    
    // Nota: A API do Mercado Pago SDK não tem um método direto de search
    // Mas podemos tentar buscar usando a preferência se tiver
    
    // Se tiver preferenceId, usar a busca por preferência
    if (preferenceId) {
      const preferenceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pagamentos/buscar-por-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          preferenceId,
        }),
      })
      
      if (preferenceResponse.ok) {
        const preferenceData = await preferenceResponse.json()
        if (preferenceData.encontrado && preferenceData.paymentId) {
          return NextResponse.json({
            encontrado: true,
            paymentId: preferenceData.paymentId,
            status: preferenceData.status,
            paymentData: preferenceData.paymentData,
            metodo: 'preference',
          })
        }
      }
    }

    // Se não encontrou pela preferência, vamos tentar buscar pagamentos recentes
    // usando uma abordagem de polling: verificar se há pagamentos criados recentemente
    // que possam corresponder a esta venda
    
    // Como a API não permite buscar diretamente, vamos retornar instruções
    // mas também vamos tentar uma última coisa: verificar se o webhook já processou
    
    return NextResponse.json({
      encontrado: false,
      message: 'Não foi possível encontrar o pagamento automaticamente.',
      vendaId,
      valorVenda,
      dataVenda: dataVenda.toISOString(),
      sugestao: 'O pagamento pode estar sendo processado. O webhook do Mercado Pago deve atualizar automaticamente em alguns segundos.',
    })
  } catch (error: any) {
    console.error('Erro ao buscar pagamentos recentes:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamentos' },
      { status: 500 }
    )
  }
}

