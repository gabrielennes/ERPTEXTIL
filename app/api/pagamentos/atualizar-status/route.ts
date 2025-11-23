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
    const { paymentId, preferenceId, vendaId: vendaIdParam } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'payment_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar informações do pagamento no Mercado Pago
    const paymentData = await payment.get({ id: paymentId })
    
    let vendaId = vendaIdParam
    
    // Se não foi passado vendaId diretamente, tentar buscar do metadata
    if (!vendaId && preferenceId) {
      try {
        // Buscar a preferência para pegar o vendaId do metadata
        const preferenceData = await preference.get({ id: preferenceId })
        
        // Tentar pegar vendaId do metadata do pagamento
        if (paymentData.metadata && paymentData.metadata.vendaId) {
          vendaId = paymentData.metadata.vendaId
        }
        // Se não tiver, tentar pegar do metadata da preferência
        else if (preferenceData.metadata && preferenceData.metadata.vendaId) {
          vendaId = preferenceData.metadata.vendaId
        }
      } catch (prefError) {
        console.error('Erro ao buscar preferência:', prefError)
        // Continuar tentando com metadata do pagamento
        if (paymentData.metadata && paymentData.metadata.vendaId) {
          vendaId = paymentData.metadata.vendaId
        }
      }
    } else if (!vendaId) {
      // Tentar pegar apenas do metadata do pagamento
      if (paymentData.metadata && paymentData.metadata.vendaId) {
        vendaId = paymentData.metadata.vendaId
      }
    }

    if (!vendaId) {
      return NextResponse.json(
        { error: 'Venda não encontrada. Verifique se o payment_id está correto.' },
        { status: 404 }
      )
    }

    // Atualizar status da venda
    const vendaAtualizada = await prisma.venda.update({
      where: { id: vendaId },
      data: {
        statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                        paymentData.status === 'rejected' ? 'rejected' : 
                        paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
        paymentId: paymentId.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      venda: vendaAtualizada,
      paymentStatus: paymentData.status,
    })
  } catch (error: any) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar status da venda' },
      { status: 500 }
    )
  }
}

