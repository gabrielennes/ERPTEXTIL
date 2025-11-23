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

    // Buscar pagamentos recentes (últimas 24 horas)
    // A API do Mercado Pago permite buscar pagamentos por data
    const agora = new Date()
    const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000) // 24 horas atrás

    // Tentar buscar pagamentos que tenham o vendaId no metadata
    // Nota: A API do Mercado Pago não permite buscar diretamente por metadata
    // Mas podemos buscar pagamentos recentes e verificar o metadata de cada um
    
    // Como alternativa, vamos retornar instruções para o usuário
    // e também tentar buscar se já tiver paymentId salvo
    
    if (venda.paymentId) {
      try {
        const paymentData = await payment.get({ id: venda.paymentId })
        return NextResponse.json({
          encontrado: true,
          paymentId: venda.paymentId,
          status: paymentData.status,
          paymentData,
        })
      } catch (err: any) {
        return NextResponse.json({
          encontrado: false,
          message: 'Payment ID não encontrado no Mercado Pago',
          sugestao: 'O pagamento pode não ter sido processado ou o ID está incorreto.',
        })
      }
    }

    // Se não tiver paymentId, vamos buscar pagamentos recentes do Mercado Pago
    // e verificar se algum corresponde a esta venda
    try {
      // Buscar pagamentos das últimas 2 horas
      // A API do Mercado Pago permite buscar pagamentos por data usando query parameters
      const agora = new Date()
      const duasHorasAtras = new Date(agora.getTime() - 2 * 60 * 60 * 1000)
      
      // Formatar data no formato ISO para a API
      const dataInicio = duasHorasAtras.toISOString().split('.')[0] + '-00:00'
      const dataFim = agora.toISOString().split('.')[0] + '-00:00'
      
      console.log('🔍 Buscando pagamentos entre', dataInicio, 'e', dataFim)
      console.log('💰 Valor da venda:', venda.total)
      
      // A API do Mercado Pago permite buscar pagamentos usando search
      // Vamos buscar pagamentos recentes e verificar se algum corresponde
      // Nota: A API não permite buscar diretamente por metadata, mas podemos buscar por valor e data
      
      // Tentar buscar pagamentos usando a API de search (se disponível)
      // Por enquanto, vamos retornar instruções mas também tentar buscar usando o preferenceId se tiver
      
      // Se a venda tiver preferenceId, usar a API de buscar-por-preference
      if (venda.preferenceId) {
        const preferenceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pagamentos/buscar-por-preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            preferenceId: venda.preferenceId,
          }),
        })
        
        if (preferenceResponse.ok) {
          const preferenceData = await preferenceResponse.json()
          if (preferenceData.encontrado && preferenceData.paymentId) {
            return NextResponse.json({
              encontrado: true,
              paymentId: preferenceData.paymentId,
              status: preferenceData.status,
              paymentData: preferenceData.paymentData,
            })
          }
        }
      }
      
      // Se não encontrou, retornar instruções para buscar manualmente
      return NextResponse.json({
        encontrado: false,
        message: 'Não foi possível encontrar o pagamento automaticamente.',
        instrucoes: [
          '1. No comprovante do Mercado Pago, copie o "Número da transação"',
          '2. Clique em "🔄 Atualizar" novamente e cole o número quando solicitado',
          '3. Ou acesse: https://www.mercadopago.com.br/developers/panel',
        ],
        vendaId: venda.id,
        dataVenda: venda.createdAt,
        valorVenda: venda.total,
        preferenceId: venda.preferenceId,
      })
    } catch (searchError: any) {
      console.error('Erro ao buscar pagamentos recentes:', searchError)
      return NextResponse.json({
        encontrado: false,
        message: 'Erro ao buscar pagamentos recentes.',
        error: searchError.message,
        vendaId: venda.id,
        dataVenda: venda.createdAt,
        valorVenda: venda.total,
      })
    }
  } catch (error: any) {
    console.error('Erro ao buscar pagamentos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamentos' },
      { status: 500 }
    )
  }
}

