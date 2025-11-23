import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log para debug
    console.log('📥 Webhook Mercado Pago recebido:', JSON.stringify(body, null, 2))

    // Processar notificação do Mercado Pago
    if (body.type === 'payment') {
      const paymentId = body.data?.id
      
      if (!paymentId) {
        console.warn('⚠️ Webhook recebido sem payment_id')
        return NextResponse.json({ received: true, warning: 'No payment_id' })
      }
      
      console.log('💳 Processando pagamento:', paymentId)
      
      // Buscar informações do pagamento
      const paymentData = await payment.get({ id: paymentId })
      
      console.log('📊 Dados do pagamento:', {
        id: paymentData.id,
        status: paymentData.status,
        metadata: paymentData.metadata,
      })
      
      // Tentar encontrar venda pelo metadata
      let vendaId = paymentData.metadata?.vendaId
      
      // Se não tiver no metadata do pagamento, tentar buscar pela preferência
      if (!vendaId && paymentData.order?.id) {
        // Se tiver order_id, pode estar relacionado a uma preferência
        console.log('🔍 Tentando buscar venda pela order_id:', paymentData.order.id)
      }
      
      // Atualizar venda se existir
      if (vendaId) {
        try {
          const vendaAtualizada = await prisma.venda.update({
            where: { id: vendaId },
            data: {
              statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                             paymentData.status === 'rejected' ? 'rejected' : 
                             paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
              paymentId: paymentId.toString(),
            },
          })
          console.log(`✅ Venda ${vendaId} atualizada automaticamente via webhook!`)
          console.log(`   Status: ${paymentData.status}`)
          console.log(`   Payment ID: ${paymentId}`)
          
          return NextResponse.json({ 
            received: true, 
            updated: true,
            vendaId,
            status: paymentData.status,
          })
        } catch (updateError: any) {
          console.error('❌ Erro ao atualizar venda:', updateError)
          
          // Se o campo statusPagamento não existir, tentar sem ele
          if (updateError.message && updateError.message.includes('statusPagamento')) {
            try {
              await prisma.venda.update({
                where: { id: vendaId },
                data: {
                  paymentId: paymentId.toString(),
                },
              })
              console.log(`✅ Venda ${vendaId} atualizada (sem status)`)
            } catch (err) {
              console.error('❌ Erro ao atualizar venda (sem status):', err)
            }
          }
          
          return NextResponse.json({ 
            received: true, 
            error: updateError.message,
          })
        }
      } else {
        console.warn('⚠️ Pagamento sem vendaId no metadata:', {
          paymentId,
          metadata: paymentData.metadata,
        })
        
        // Tentar buscar venda pendente pelo valor e data (última tentativa)
        // Isso é útil quando o metadata não foi passado corretamente
        try {
          const vendasPendentes = await prisma.venda.findMany({
            where: {
              statusPagamento: 'pending',
              paymentId: null,
              total: paymentData.transaction_amount || 0,
              createdAt: {
                gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Últimas 2 horas
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          })
          
          if (vendasPendentes.length > 0) {
            // Atualizar a venda mais recente com o mesmo valor
            const vendaEncontrada = vendasPendentes[0]
            console.log(`🔍 Venda encontrada por valor e data: ${vendaEncontrada.id}`)
            
            await prisma.venda.update({
              where: { id: vendaEncontrada.id },
              data: {
                statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                               paymentData.status === 'rejected' ? 'rejected' : 
                               paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
                paymentId: paymentId.toString(),
              },
            })
            
            console.log(`✅ Venda ${vendaEncontrada.id} atualizada automaticamente!`)
            
            return NextResponse.json({ 
              received: true, 
              updated: true,
              vendaId: vendaEncontrada.id,
              status: paymentData.status,
              metodo: 'busca_por_valor',
            })
          }
        } catch (searchError) {
          console.error('Erro ao buscar venda por valor:', searchError)
        }
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

