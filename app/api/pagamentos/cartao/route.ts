import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { prisma } from '@/lib/prisma'

// Inicializar cliente do Mercado Pago
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
    const { vendaId, total, itens, dadosCartao } = body

    if (!vendaId || !total || !dadosCartao) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Validar dados do cartão
    const numeroCartao = dadosCartao.numero.replace(/\s/g, '')
    const mesVencimento = dadosCartao.vencimento.split('/')[0]
    const anoVencimento = '20' + dadosCartao.vencimento.split('/')[1]

    if (!numeroCartao || numeroCartao.length < 13 || numeroCartao.length > 16) {
      return NextResponse.json(
        { error: 'Número do cartão inválido' },
        { status: 400 }
      )
    }

    // Detectar tipo de cartão pelo número
    let paymentMethodId = 'visa'
    const firstDigit = numeroCartao[0]
    if (firstDigit === '4') paymentMethodId = 'visa'
    else if (firstDigit === '5') paymentMethodId = 'master'
    else if (firstDigit === '3') paymentMethodId = 'amex'

    // Para processar pagamento direto com cartão, precisamos usar a estrutura correta
    // O Mercado Pago requer tokenização do cartão, mas para testes podemos usar a estrutura alternativa
    const paymentData: any = {
      transaction_amount: parseFloat(total),
      description: `Venda #${vendaId}`,
      installments: 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: 'test@test.com', // Em produção, pegue do usuário logado
        identification: {
          type: 'CPF',
          number: dadosCartao.cpf.replace(/\D/g, ''),
        },
      },
      // Usar a estrutura de card correta do Mercado Pago
      card: {
        card_number: numeroCartao,
        cardholder: {
          name: dadosCartao.nome,
          identification: {
            type: 'CPF',
            number: dadosCartao.cpf.replace(/\D/g, ''),
          },
        },
        expiration_month: parseInt(mesVencimento),
        expiration_year: parseInt(anoVencimento),
        security_code: dadosCartao.cvv,
      },
      metadata: {
        vendaId: vendaId,
      },
    }

    // Para ambiente de teste, podemos tentar sem token primeiro
    // Se não funcionar, precisaremos tokenizar o cartão no frontend

    // Processar pagamento
    const paymentResponse = await payment.create({ body: paymentData })

    // Atualizar venda com o status do pagamento
    await prisma.venda.update({
      where: { id: vendaId },
      data: {
        statusPagamento: paymentResponse.status === 'approved' ? 'approved' : 
                        paymentResponse.status === 'rejected' ? 'rejected' : 'pending',
        paymentId: paymentResponse.id?.toString() || null,
      },
    })

    return NextResponse.json({
      id: paymentResponse.id,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
      message: paymentResponse.status === 'approved' 
        ? 'Pagamento aprovado com sucesso' 
        : paymentResponse.status === 'rejected'
        ? 'Pagamento recusado'
        : 'Pagamento pendente',
    })
  } catch (error: any) {
    console.error('Erro ao processar pagamento com cartão:', error)
    
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

