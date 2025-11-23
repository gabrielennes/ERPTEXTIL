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
    const { vendaId } = body

    if (!vendaId) {
      return NextResponse.json(
        { error: 'vendaId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a venda no banco
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId },
    })

    if (!venda) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Se já tiver paymentId, retornar
    if (venda.paymentId) {
      return NextResponse.json({
        paymentId: venda.paymentId,
        status: venda.statusPagamento,
      })
    }

    // Tentar buscar pagamentos recentes do Mercado Pago que possam estar relacionados
    // Como não temos uma API direta para buscar por metadata, vamos retornar null
    // e o frontend pode tentar atualizar usando outras informações
    
    return NextResponse.json({
      paymentId: null,
      message: 'Pagamento ainda não foi processado ou não foi encontrado. Tente novamente em alguns instantes.',
    })
  } catch (error: any) {
    console.error('Erro ao buscar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamento' },
      { status: 500 }
    )
  }
}

