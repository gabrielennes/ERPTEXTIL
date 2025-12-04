import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const payment = new Payment(client)
const preference = new Preference(client)

const getParcelasFromPayment = (paymentData: any) =>
  typeof paymentData?.installments === 'number' && paymentData.installments > 0
    ? paymentData.installments
    : undefined

// Esta API verifica vendas pendentes e tenta atualizar automaticamente
// Pode ser chamada periodicamente ou manualmente
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
    // Buscar vendas pendentes das últimas 2 horas
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000)
    
    const vendasPendentes = await prisma.venda.findMany({
      where: {
        statusPagamento: 'pending',
        createdAt: {
          gte: duasHorasAtras,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limitar a 20 vendas por vez
    })

    console.log(`🔍 Verificando ${vendasPendentes.length} vendas pendentes...`)

    const resultados = {
      verificadas: 0,
      atualizadas: 0,
      naoEncontradas: 0,
      erros: [] as string[],
    }

    for (const venda of vendasPendentes) {
      try {
        resultados.verificadas++

        // Se tiver paymentId, verificar diretamente
        if (venda.paymentId) {
          try {
            const paymentData = await payment.get({ id: venda.paymentId })
            const parcelasPagamento = getParcelasFromPayment(paymentData)
            
            await prisma.venda.update({
              where: { id: venda.id },
              data: {
                statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                               paymentData.status === 'rejected' ? 'rejected' : 
                               paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
                ...(parcelasPagamento ? { parcelas: parcelasPagamento } : {}),
              },
            })
            
            resultados.atualizadas++
            console.log(`✅ Venda ${venda.id} atualizada: ${paymentData.status}`)
          } catch (err: any) {
            resultados.erros.push(`Venda ${venda.id}: ${err.message}`)
          }
          continue
        }

        // Se não tiver paymentId, tentar buscar pela preferência (se tiver preferenceId)
        // Por enquanto, vamos apenas marcar como não encontrada
        // O webhook deve processar automaticamente
        resultados.naoEncontradas++
      } catch (err: any) {
        resultados.erros.push(`Venda ${venda.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      resultados,
      mensagem: `Verificadas ${resultados.verificadas} vendas. ${resultados.atualizadas} atualizadas.`,
    })
  } catch (error: any) {
    console.error('Erro ao verificar vendas pendentes:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar vendas pendentes' },
      { status: 500 }
    )
  }
}

