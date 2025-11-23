import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { prisma } from '@/lib/prisma'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
  },
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
    const { vendaId, total, itens } = body

    if (!vendaId || !total) {
      return NextResponse.json(
        { error: 'vendaId e total são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar pagamento usando saldo em conta (account_money)
    // Esta é a Payments API direta - gera payment_id imediatamente
    const paymentData = {
      transaction_amount: parseFloat(total),
      description: `Venda #${vendaId}`,
      payment_method_id: 'account_money', // Saldo em conta
      payer: {
        email: 'test@test.com', // Em produção, pegue do usuário logado
      },
      metadata: {
        vendaId: vendaId,
      },
    }

    console.log('💳 Criando pagamento com saldo em conta:', paymentData)

    // Processar pagamento - isso gera o payment_id imediatamente
    const paymentResponse = await payment.create({ body: paymentData })

    console.log('✅ Pagamento criado:', {
      id: paymentResponse.id,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
    })

    // Atualizar venda com o status do pagamento
    const vendaAtualizada = await prisma.venda.update({
      where: { id: vendaId },
      data: {
        statusPagamento: paymentResponse.status === 'approved' ? 'approved' : 
                        paymentResponse.status === 'rejected' ? 'rejected' : 
                        paymentResponse.status === 'cancelled' ? 'cancelled' : 'pending',
        paymentId: paymentResponse.id?.toString() || null,
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: paymentResponse.id,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
      venda: vendaAtualizada,
      message: paymentResponse.status === 'approved' 
        ? 'Pagamento aprovado com sucesso' 
        : paymentResponse.status === 'rejected'
        ? 'Pagamento recusado'
        : 'Pagamento pendente',
    })
  } catch (error: any) {
    console.error('❌ Erro ao processar pagamento com saldo:', error)
    
    // Tratar erros específicos do Mercado Pago
    if (error.cause && error.cause.length > 0) {
      const errorMessage = error.cause[0].description || error.message
      return NextResponse.json(
        { error: errorMessage || 'Erro ao processar pagamento' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}

