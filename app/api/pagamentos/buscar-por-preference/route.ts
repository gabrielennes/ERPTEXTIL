import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '@/lib/prisma'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const preference = new Preference(client)
const payment = new Payment(client)

const getParcelasFromPayment = (paymentData: any) =>
  typeof paymentData?.installments === 'number' && paymentData.installments > 0
    ? paymentData.installments
    : undefined

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
    const { preferenceId } = body

    if (!preferenceId) {
      return NextResponse.json(
        { error: 'preference_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a preferência
    const preferenceData = await preference.get({ preferenceId })
    
    if (!preferenceData) {
      return NextResponse.json(
        { error: 'Preferência não encontrada' },
        { status: 404 }
      )
    }

    // Pegar vendaId do metadata
    const vendaId = preferenceData.metadata?.vendaId
    
    if (!vendaId) {
      return NextResponse.json(
        { error: 'Venda não encontrada no metadata da preferência' },
        { status: 404 }
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

    // Se já tiver paymentId, retornar
    if (venda.paymentId) {
      try {
        const paymentData = await payment.get({ id: venda.paymentId })
        return NextResponse.json({
          encontrado: true,
          paymentId: venda.paymentId,
          status: paymentData.status,
          paymentData: {
            id: paymentData.id,
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            transaction_amount: paymentData.transaction_amount,
            date_created: paymentData.date_created,
          },
          venda: {
            id: venda.id,
            statusPagamento: venda.statusPagamento,
          },
        })
      } catch (err) {
        // Se o paymentId não existir mais, continuar buscando
        console.log('PaymentId não encontrado, buscando novos pagamentos...')
      }
    }

    // Tentar buscar pagamentos recentes que possam estar relacionados
    // A API do Mercado Pago não permite buscar diretamente por preference_id,
    // mas podemos buscar pagamentos recentes e verificar o metadata
    
    // Buscar pagamentos das últimas 2 horas que tenham o vendaId no metadata
    // Nota: A API do Mercado Pago não tem endpoint para buscar por metadata,
    // então vamos tentar uma abordagem diferente
    
    // Verificar se a preferência tem payment_ids associados
    // (algumas versões da API retornam isso)
    if (preferenceData.payment_ids && preferenceData.payment_ids.length > 0) {
      // Tentar buscar o pagamento mais recente
      const ultimoPaymentId = preferenceData.payment_ids[preferenceData.payment_ids.length - 1]
      try {
        const paymentData = await payment.get({ id: ultimoPaymentId })
        const parcelasPagamento = getParcelasFromPayment(paymentData)
        
        // Verificar se o metadata corresponde OU se o valor corresponde
        const valorCorresponde = Math.abs((paymentData.transaction_amount || 0) - venda.total) < 0.01
        const metadataCorresponde = paymentData.metadata?.vendaId === vendaId
        
        if (metadataCorresponde || valorCorresponde) {
          // Atualizar a venda com o paymentId encontrado
          const vendaAtualizada = await prisma.venda.update({
            where: { id: vendaId },
            data: {
              paymentId: paymentData.id?.toString() || null,
              statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                              paymentData.status === 'rejected' ? 'rejected' : 
                              paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
              ...(parcelasPagamento ? { parcelas: parcelasPagamento } : {}),
            },
          })
          
          console.log(`✅ Venda ${vendaId} atualizada automaticamente! Payment ID: ${paymentData.id}`)
          
          return NextResponse.json({
            encontrado: true,
            paymentId: paymentData.id,
            status: paymentData.status,
            paymentData: {
              id: paymentData.id,
              status: paymentData.status,
              status_detail: paymentData.status_detail,
              transaction_amount: paymentData.transaction_amount,
              date_created: paymentData.date_created,
            },
            venda: vendaAtualizada,
          })
        }
      } catch (err) {
        console.error('Erro ao buscar pagamento:', err)
      }
    }

    // Se não encontrou pelos payment_ids da preferência, vamos tentar uma busca mais agressiva
    // Buscar pagamentos criados nas últimas 2 horas e verificar se algum corresponde
    try {
      console.log('🔍 Buscando pagamentos recentes que possam corresponder à venda...')
      
      // Calcular data de início (2 horas antes da criação da venda ou agora, o que for mais recente)
      const agora = new Date()
      const dataVenda = new Date(venda.createdAt)
      const duasHorasAtras = new Date(agora.getTime() - 2 * 60 * 60 * 1000)
      const dataInicio = dataVenda < duasHorasAtras ? duasHorasAtras : dataVenda
      
      // A API do Mercado Pago não permite buscar diretamente por metadata ou valor
      // Mas podemos tentar uma abordagem: verificar se há pagamentos recentes
      // que tenham o mesmo valor (com tolerância de centavos) e metadata correspondente
      
      // Nota: A API do Mercado Pago SDK não tem um método de search direto
      // Mas podemos usar a API REST diretamente se necessário
      
      // Por enquanto, vamos retornar que não encontrou, mas com instruções
      // O webhook deve processar automaticamente em alguns segundos
      
      console.log('⏳ Aguardando processamento do webhook...')
      
      return NextResponse.json({
        encontrado: false,
        message: 'Nenhum pagamento encontrado para esta preferência ainda',
        preferenceId,
        venda: {
          id: venda.id,
          statusPagamento: venda.statusPagamento,
          createdAt: venda.createdAt,
          total: venda.total,
        },
        sugestao: 'O pagamento pode estar sendo processado. O webhook do Mercado Pago deve atualizar automaticamente em alguns segundos. Se não atualizar, tente novamente em alguns instantes.',
        tentarNovamente: true,
      })
    } catch (searchError: any) {
      console.error('Erro ao buscar pagamentos recentes:', searchError)
      return NextResponse.json({
        encontrado: false,
        message: 'Erro ao buscar pagamentos',
        error: searchError.message,
        preferenceId,
        venda: {
          id: venda.id,
          statusPagamento: venda.statusPagamento,
          createdAt: venda.createdAt,
        },
      })
    }
  } catch (error: any) {
    console.error('Erro ao buscar pagamento por preferência:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamento' },
      { status: 500 }
    )
  }
}
