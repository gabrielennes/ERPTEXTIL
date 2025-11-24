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

    // Se tiver paymentId mas não preferenceId, tentar buscar venda pelo paymentId salvo
    if (paymentId && !preferenceId && !vendaIdParam) {
      const vendaPorPaymentId = await prisma.venda.findFirst({
        where: {
          paymentId: paymentId.toString(),
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      
      if (vendaPorPaymentId) {
        // Venda já tem esse paymentId, apenas atualizar status
        const paymentData = await payment.get({ id: paymentId })
        const vendaAtualizada = await prisma.venda.update({
          where: { id: vendaPorPaymentId.id },
          data: {
            statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                            paymentData.status === 'rejected' ? 'rejected' : 
                            paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
          },
        })
        
        return NextResponse.json({
          success: true,
          venda: vendaAtualizada,
          paymentStatus: paymentData.status,
        })
      }
    }

    // Buscar informações do pagamento no Mercado Pago
    const paymentData = await payment.get({ id: paymentId })
    
    let vendaId = vendaIdParam
    
    // Se não foi passado vendaId diretamente, tentar buscar do metadata
    if (!vendaId && preferenceId) {
      try {
        // PRIMEIRO: Tentar buscar venda pelo preferenceId salvo no banco
        const vendaPorPreference = await prisma.venda.findFirst({
          where: {
            preferenceId: preferenceId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        if (vendaPorPreference) {
          vendaId = vendaPorPreference.id
          console.log(`✅ Venda encontrada pelo preferenceId: ${vendaId}`)
        } else {
          // Se não encontrou pelo preferenceId, tentar buscar pela preferência do Mercado Pago
          const preferenceData = await preference.get({ id: preferenceId })
          
          // Tentar pegar vendaId do metadata do pagamento
          if (paymentData.metadata && paymentData.metadata.vendaId) {
            vendaId = paymentData.metadata.vendaId
          }
          // Se não tiver, tentar pegar do metadata da preferência
          else if (preferenceData.metadata && preferenceData.metadata.vendaId) {
            vendaId = preferenceData.metadata.vendaId
          }
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

    // Se ainda não encontrou e tem preferenceId, tentar buscar vendas pendentes recentes
    if (!vendaId && preferenceId) {
      try {
        const vendaPendente = await prisma.venda.findFirst({
          where: {
            preferenceId: preferenceId,
            statusPagamento: 'pending',
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        if (vendaPendente) {
          vendaId = vendaPendente.id
          console.log(`✅ Venda pendente encontrada pelo preferenceId: ${vendaId}`)
        }
      } catch (err) {
        console.error('Erro ao buscar venda pendente:', err)
      }
    }

    // Se ainda não encontrou, tentar buscar por valor do pagamento (última tentativa)
    if (!vendaId) {
      try {
        const valorPagamento = paymentData.transaction_amount || 0
        
        // Buscar vendas pendentes recentes com o mesmo valor
        const vendasPendentes = await prisma.venda.findMany({
          where: {
            statusPagamento: 'pending',
            paymentId: null,
            total: valorPagamento,
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
          vendaId = vendasPendentes[0].id
          console.log(`✅ Venda encontrada por valor: ${vendaId}`)
        }
      } catch (err) {
        console.error('Erro ao buscar venda por valor:', err)
      }
    }

    if (!vendaId) {
      return NextResponse.json(
        { error: 'Venda não encontrada. Verifique se o payment_id está correto ou se a venda foi criada corretamente.' },
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

