import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import { prisma } from '@/lib/prisma'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const payment = new Payment(client)
const preference = new Preference(client)

const getParcelasFromPayment = (paymentData: any) =>
  typeof paymentData?.installments === 'number' && paymentData.installments > 0
    ? paymentData.installments
    : undefined

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
        const preferenceData = (await preference.get({ preferenceId: prefId })) as any
        
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
                const parcelasPagamento = getParcelasFromPayment(paymentData)
                console.log(`✅ Pagamento encontrado! ID: ${paymentData.id}, Status: ${paymentData.status}`)
                
                // Atualizar a venda
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
        // Se a preferência não foi encontrada, continuar com outras estratégias
      }
    }

    // Estratégia 2: Buscar pagamentos aprovados recentes usando a API REST do Mercado Pago
    // Como o pagamento foi aprovado, vamos tentar buscar pagamentos aprovados das últimas horas
    try {
      console.log('🔍 Tentando buscar pagamentos aprovados recentes...')
      
      // Usar a API REST do Mercado Pago para buscar pagamentos
      // A API permite buscar por status e data
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (accessToken) {
        // Calcular data de início (2 horas antes da criação da venda)
        const dataVenda = new Date(venda.createdAt)
        const duasHorasAtras = new Date(dataVenda.getTime() - 2 * 60 * 60 * 1000)
        const dataFim = encodeURIComponent(new Date(dataVenda.getTime() + 2 * 60 * 60 * 1000).toISOString())
        const dataInicio = encodeURIComponent(duasHorasAtras.toISOString())
        
        // Buscar pagamentos aprovados recentes usando a API REST
        const searchUrl = `https://api.mercadopago.com/v1/payments/search?status=approved&range=date_created&begin_date=${dataInicio}&end_date=${dataFim}&sort=date_created&criteria=desc&limit=50`
        
        const searchResponse = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          console.log(`📊 Encontrados ${searchData.results?.length || 0} pagamentos aprovados recentes`)
          
          // Procurar pagamento que corresponda ao valor da venda
          if (searchData.results && searchData.results.length > 0) {
            for (const paymentResult of searchData.results) {
              const valorCorresponde = Math.abs((paymentResult.transaction_amount || 0) - venda.total) < 0.01
              const metadataCorresponde = paymentResult.metadata?.vendaId === vendaId
              
              // Verificar também se o payment_id está relacionado à preferência
              let relacionadoPreferencia = false
              if (prefId && paymentResult.order?.id) {
                relacionadoPreferencia = paymentResult.order.id.toString() === prefId.toString()
              }
              
              // Se o valor corresponde E (metadata corresponde OU está relacionado à preferência)
              if (valorCorresponde && (metadataCorresponde || relacionadoPreferencia)) {
                const parcelasPagamento = getParcelasFromPayment(paymentResult)
                console.log(`✅ Pagamento encontrado via busca REST! ID: ${paymentResult.id}, Status: ${paymentResult.status}`)
                
                // Atualizar a venda
                const vendaAtualizada = await prisma.venda.update({
                  where: { id: vendaId },
                  data: {
                    paymentId: paymentResult.id?.toString() || null,
                    statusPagamento: paymentResult.status === 'approved' ? 'approved' : 
                                    paymentResult.status === 'rejected' ? 'rejected' : 
                                    paymentResult.status === 'cancelled' ? 'cancelled' : 'pending',
                    ...(parcelasPagamento ? { parcelas: parcelasPagamento } : {}),
                  },
                })
                
                console.log(`✅ Venda ${vendaId} atualizada automaticamente via busca REST!`)
                
                return NextResponse.json({
                  encontrado: true,
                  paymentId: paymentResult.id,
                  status: paymentResult.status,
                  paymentData: {
                    id: paymentResult.id,
                    status: paymentResult.status,
                    status_detail: paymentResult.status_detail,
                    transaction_amount: paymentResult.transaction_amount,
                  },
                  venda: vendaAtualizada,
                  metodo: 'busca_rest_aprovados',
                })
              }
            }
          }
        }
      }
    } catch (searchError: any) {
      console.error('Erro ao buscar pagamentos via REST:', searchError.message)
    }

    // Estratégia 3: Se ainda não encontrou, retornar que não encontrou mas com sugestão
    return NextResponse.json({
      encontrado: false,
      message: 'Pagamento não encontrado automaticamente ainda',
      vendaId,
      valor: venda.total,
      preferenceId: prefId,
      sugestao: 'O pagamento pode estar sendo processado. Tente usar o botão "Usar Nº Transação" com o número do comprovante do Mercado Pago.',
    })
  } catch (error: any) {
    console.error('Erro ao buscar e atualizar automaticamente:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamento' },
      { status: 500 }
    )
  }
}

