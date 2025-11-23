import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { prisma } from '@/lib/prisma'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const payment = new Payment(client)
const preference = new Preference(client)

// Esta API busca pagamentos recentes do Mercado Pago e atualiza vendas pendentes automaticamente
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
    const { vendaId, preferenceId } = body

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

    // Se já tiver paymentId e estiver aprovada, retornar
    if (venda.paymentId && venda.statusPagamento === 'approved') {
      return NextResponse.json({
        encontrado: true,
        paymentId: venda.paymentId,
        status: 'approved',
        message: 'Venda já está aprovada',
      })
    }

    console.log('🔍 Buscando pagamento para venda:', {
      vendaId,
      valor: venda.total,
      dataVenda: venda.createdAt,
      preferenceId: preferenceId || venda.preferenceId,
    })

    // Estratégia 1: Se tiver preferenceId, buscar pagamentos relacionados à preferência
    const prefId = preferenceId || venda.preferenceId
    if (prefId) {
      try {
        console.log(`🔍 Buscando preferência: ${prefId}`)
        const preferenceData = await preference.get({ id: prefId })
        
        console.log('📋 Dados da preferência:', {
          id: preferenceData.id,
          status: preferenceData.status,
          payment_ids: preferenceData.payment_ids,
        })
        
        // Verificar se a preferência tem payment_ids
        if (preferenceData.payment_ids && preferenceData.payment_ids.length > 0) {
          console.log(`💳 Encontrados ${preferenceData.payment_ids.length} pagamentos na preferência`)
          
          // Buscar todos os pagamentos e verificar qual corresponde
          for (const paymentIdStr of preferenceData.payment_ids) {
            try {
              const paymentData = await payment.get({ id: paymentIdStr })
              
              console.log(`🔍 Verificando pagamento ${paymentData.id}:`, {
                status: paymentData.status,
                valor: paymentData.transaction_amount,
                vendaValor: venda.total,
                metadata: paymentData.metadata,
              })
              
              // Verificar se corresponde à venda (mesmo valor ou metadata)
              const valorCorresponde = Math.abs((paymentData.transaction_amount || 0) - venda.total) < 0.01
              const metadataCorresponde = paymentData.metadata?.vendaId === vendaId
              
              if (valorCorresponde || metadataCorresponde) {
                console.log(`✅ Pagamento encontrado! ID: ${paymentData.id}, Status: ${paymentData.status}`)
                
                // Atualizar a venda
                const vendaAtualizada = await prisma.venda.update({
                  where: { id: vendaId },
                  data: {
                    paymentId: paymentData.id?.toString() || null,
                    statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                                    paymentData.status === 'rejected' ? 'rejected' : 
                                    paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
                  },
                })
                
                console.log(`✅ Venda ${vendaId} atualizada automaticamente!`)
                console.log(`   Payment ID: ${paymentData.id}`)
                console.log(`   Status: ${paymentData.status}`)
                
                return NextResponse.json({
                  encontrado: true,
                  paymentId: paymentData.id,
                  status: paymentData.status,
                  paymentData: {
                    id: paymentData.id,
                    status: paymentData.status,
                    status_detail: paymentData.status_detail,
                    transaction_amount: paymentData.transaction_amount,
                  },
                  venda: vendaAtualizada,
                  metodo: 'preference_payment_ids',
                })
              }
            } catch (err: any) {
              console.error(`Erro ao buscar pagamento ${paymentIdStr}:`, err.message)
            }
          }
        } else {
          console.log('⚠️ Preferência não tem payment_ids ainda. O pagamento pode estar sendo processado.')
        }
      } catch (err: any) {
        console.error('Erro ao buscar preferência:', err.message)
      }
    }

    // Estratégia 2: Buscar pagamentos recentes que possam corresponder
    // A API do Mercado Pago não permite buscar diretamente por valor ou metadata
    // Mas podemos tentar buscar pagamentos criados após a venda e verificar manualmente
    
    // Como a API não tem search direto, vamos retornar que não encontrou
    // mas sugerir que o webhook deve processar
    
    return NextResponse.json({
      encontrado: false,
      message: 'Pagamento não encontrado automaticamente ainda',
      vendaId,
      sugestao: 'O webhook do Mercado Pago deve atualizar automaticamente em alguns segundos. Se não atualizar, verifique o webhook no painel do Mercado Pago.',
    })
  } catch (error: any) {
    console.error('Erro ao buscar e atualizar automaticamente:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamento' },
      { status: 500 }
    )
  }
}

