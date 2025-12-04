import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { prisma } from '@/lib/prisma'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const payment = new Payment(client)
const preference = new Preference(client)

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
    const { preferenceId, vendaId } = body

    if (!preferenceId) {
      return NextResponse.json(
        { error: 'preference_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a preferência
    const preferenceData = await preference.get({ preferenceId })
    
    // Buscar venda se não foi passada
    let venda = null
    if (vendaId) {
      venda = await prisma.venda.findUnique({
        where: { id: vendaId },
      })
    } else if (preferenceData.metadata && preferenceData.metadata.vendaId) {
      venda = await prisma.venda.findUnique({
        where: { id: preferenceData.metadata.vendaId },
      })
    }

    // Tentar buscar pagamentos relacionados a esta preferência
    // Nota: A API do Mercado Pago não permite buscar pagamentos por preference_id diretamente
    // Mas podemos verificar se há pagamentos no metadata da preferência
    
    // Verificar se há payment_id no metadata da preferência
    let paymentId = null
    if (preferenceData.metadata && preferenceData.metadata.payment_id) {
      paymentId = preferenceData.metadata.payment_id
    }

    // Se tiver paymentId, verificar o status
    if (paymentId) {
      try {
        const paymentData = await payment.get({ id: paymentId })
        return NextResponse.json({
          encontrado: true,
          paymentId,
          status: paymentData.status,
          paymentData: {
            id: paymentData.id,
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            transaction_amount: paymentData.transaction_amount,
            date_created: paymentData.date_created,
          },
          venda: venda ? {
            id: venda.id,
            statusPagamento: venda.statusPagamento,
          } : null,
        })
      } catch (err: any) {
        return NextResponse.json({
          encontrado: false,
          message: 'Payment ID encontrado mas não é válido na API',
          error: err.message,
        })
      }
    }

    // Se não tiver paymentId, tentar buscar pagamentos recentes que possam estar relacionados
    // Buscar pagamentos criados nas últimas horas que tenham o mesmo valor e metadata
    try {
      // A API do Mercado Pago permite buscar pagamentos por data
      // Vamos buscar pagamentos das últimas 2 horas
      const agora = new Date()
      const duasHorasAtras = new Date(agora.getTime() - 2 * 60 * 60 * 1000)
      
      // Nota: A API do Mercado Pago não tem um endpoint direto para buscar por preference_id
      // Mas podemos tentar buscar pagamentos recentes e verificar o metadata
      // Por enquanto, vamos retornar informações da preferência para debug
      
      console.log('Preferência encontrada:', {
        id: preferenceData.id,
        status: preferenceData.status,
        metadata: preferenceData.metadata,
        date_created: preferenceData.date_created,
      })
      
      // Verificar se a preferência tem informações sobre pagamentos
      // Algumas versões da API retornam payment_ids relacionados
      const paymentIds = preferenceData.payment_ids || []
      
      if (paymentIds && paymentIds.length > 0) {
        // Se tiver payment_ids, buscar o mais recente
        const ultimoPaymentId = paymentIds[paymentIds.length - 1]
        try {
          const paymentData = await payment.get({ id: ultimoPaymentId })
          return NextResponse.json({
            encontrado: true,
            paymentId: ultimoPaymentId,
            status: paymentData.status,
            paymentData: {
              id: paymentData.id,
              status: paymentData.status,
              status_detail: paymentData.status_detail,
              transaction_amount: paymentData.transaction_amount,
              date_created: paymentData.date_created,
            },
            venda: venda ? {
              id: venda.id,
              statusPagamento: venda.statusPagamento,
            } : null,
          })
        } catch (err) {
          // Continuar
        }
      }
    } catch (searchError) {
      console.error('Erro ao buscar pagamentos:', searchError)
    }

    // Se não encontrou, retornar informações para debug
    return NextResponse.json({
      encontrado: false,
      message: 'Nenhum pagamento encontrado para esta preferência',
      preferenceId,
      preferenceStatus: preferenceData.status,
      preferenceDateCreated: preferenceData.date_created,
      metadata: preferenceData.metadata,
      venda: venda ? {
        id: venda.id,
        statusPagamento: venda.statusPagamento,
        createdAt: venda.createdAt,
      } : null,
      sugestao: 'O pagamento pode estar sendo processado. Aguarde alguns instantes e tente novamente, ou verifique diretamente no painel do Mercado Pago.',
    })
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    )
  }
}

