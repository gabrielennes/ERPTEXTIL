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
    // Buscar todas as vendas pendentes
    const vendasPendentes = await prisma.venda.findMany({
      where: {
        OR: [
          { statusPagamento: 'pending' },
          { statusPagamento: null },
        ],
        metodoPagamento: {
          in: ['cartao', 'pix', 'mercadopago'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limitar a 50 para não sobrecarregar
    })

    const resultados = {
      atualizadas: 0,
      naoEncontradas: 0,
      erros: [] as string[],
    }

    // Para cada venda pendente, tentar encontrar o pagamento
    for (const venda of vendasPendentes) {
      try {
        // Se já tiver paymentId, buscar diretamente
        if (venda.paymentId) {
          try {
            const paymentData = await payment.get({ id: venda.paymentId })
            
            await prisma.venda.update({
              where: { id: venda.id },
              data: {
                statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                                paymentData.status === 'rejected' ? 'rejected' : 
                                paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
              },
            })
            
            resultados.atualizadas++
          } catch (err: any) {
            resultados.erros.push(`Venda ${venda.id}: ${err.message}`)
          }
        } else {
          // Se não tiver paymentId, tentar buscar usando o preferenceId
          if (venda.preferenceId) {
            try {
              console.log(`🔍 Buscando pagamento para venda ${venda.id} usando preferenceId: ${venda.preferenceId}`)
              
              // Buscar a preferência
              const preferenceData = await preference.get({ id: venda.preferenceId })
              
              // Verificar se a preferência tem payment_ids
              if (preferenceData.payment_ids && preferenceData.payment_ids.length > 0) {
                console.log(`💳 Encontrados ${preferenceData.payment_ids.length} pagamentos na preferência`)
                
                let encontrado = false
                
                // Buscar o pagamento mais recente que corresponda à venda
                for (const paymentIdStr of preferenceData.payment_ids) {
                  try {
                    const paymentData = await payment.get({ id: paymentIdStr })
                    
                    // Verificar se corresponde à venda (mesmo valor ou metadata)
                    const valorCorresponde = Math.abs((paymentData.transaction_amount || 0) - venda.total) < 0.01
                    const metadataCorresponde = paymentData.metadata?.vendaId === venda.id
                    
                    if (valorCorresponde || metadataCorresponde) {
                      // Atualizar a venda
                      await prisma.venda.update({
                        where: { id: venda.id },
                        data: {
                          paymentId: paymentData.id?.toString() || null,
                          statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                                          paymentData.status === 'rejected' ? 'rejected' : 
                                          paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
                        },
                      })
                      
                      console.log(`✅ Venda ${venda.id} atualizada! Payment ID: ${paymentData.id}, Status: ${paymentData.status}`)
                      resultados.atualizadas++
                      encontrado = true
                      break // Parar após encontrar o primeiro pagamento correspondente
                    }
                  } catch (err: any) {
                    console.error(`Erro ao buscar pagamento ${paymentIdStr}:`, err.message)
                  }
                }
                
                // Se não encontrou nenhum pagamento correspondente
                if (!encontrado) {
                  console.log(`⚠️ Venda ${venda.id} tem preferenceId mas nenhum pagamento correspondeu`)
                  resultados.naoEncontradas++
                }
              } else {
                console.log(`⚠️ Preferência ${venda.preferenceId} não tem payment_ids ainda`)
                resultados.naoEncontradas++
              }
            } catch (err: any) {
              console.error(`Erro ao buscar preferência para venda ${venda.id}:`, err.message)
              resultados.erros.push(`Venda ${venda.id}: ${err.message}`)
            }
          } else {
            // Se não tiver preferenceId nem paymentId, não há como buscar
            console.log(`⚠️ Venda ${venda.id} não tem paymentId nem preferenceId`)
            resultados.naoEncontradas++
          }
        }
      } catch (err: any) {
        resultados.erros.push(`Venda ${venda.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      total: vendasPendentes.length,
      atualizadas: resultados.atualizadas,
      naoEncontradas: resultados.naoEncontradas,
      erros: resultados.erros,
    })
  } catch (error: any) {
    console.error('Erro ao atualizar vendas pendentes:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar vendas pendentes' },
      { status: 500 }
    )
  }
}

