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
          } catch (err: any) {
            resultados.erros.push(`Venda ${venda.id}: ${err.message}`)
          }
        } else {
          // Se não tiver paymentId, tentar buscar usando o preferenceId
          if (venda.preferenceId) {
            try {
              console.log(`🔍 Buscando pagamento para venda ${venda.id} usando preferenceId: ${venda.preferenceId}`)
              
              // Buscar a preferência
              const preferenceData = (await preference.get({
                preferenceId: venda.preferenceId,
              })) as any
              
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
                      const parcelasPagamento = getParcelasFromPayment(paymentData)
                      // Atualizar a venda
                      await prisma.venda.update({
                        where: { id: venda.id },
                        data: {
                          paymentId: paymentData.id?.toString() || null,
                          statusPagamento: paymentData.status === 'approved' ? 'approved' : 
                                          paymentData.status === 'rejected' ? 'rejected' : 
                                          paymentData.status === 'cancelled' ? 'cancelled' : 'pending',
                          ...(parcelasPagamento ? { parcelas: parcelasPagamento } : {}),
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
                console.log(`⚠️ Preferência ${venda.preferenceId} não tem payment_ids ainda. Tentando busca alternativa...`)
                
                // ESTRATÉGIA ALTERNATIVA: Buscar pagamentos aprovados recentes usando API REST
                // e verificar se algum está relacionado a esta preferência
                try {
                  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
                  if (accessToken) {
                    // Buscar pagamentos aprovados das últimas 24 horas
                    const dataVenda = new Date(venda.createdAt)
                    const vinteQuatroHorasAtras = new Date(dataVenda.getTime() - 24 * 60 * 60 * 1000)
                    const dataInicio = encodeURIComponent(vinteQuatroHorasAtras.toISOString())
                    const dataFim = encodeURIComponent(new Date(dataVenda.getTime() + 2 * 60 * 60 * 1000).toISOString())
                    
                    // Buscar pagamentos aprovados recentes
                    const searchUrl = `https://api.mercadopago.com/v1/payments/search?status=approved&range=date_created&begin_date=${dataInicio}&end_date=${dataFim}&sort=date_created&criteria=desc&limit=100`
                    
                    console.log(`🔍 Buscando pagamentos aprovados recentes para venda ${venda.id}...`)
                    
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
                      
                      let encontrado = false
                      
                      // Procurar pagamento que corresponda ao valor E esteja relacionado à preferência
                      if (searchData.results && searchData.results.length > 0) {
                        for (const paymentResult of searchData.results) {
                          const valorCorresponde = Math.abs((paymentResult.transaction_amount || 0) - venda.total) < 0.01
                          const metadataCorresponde = paymentResult.metadata?.vendaId === venda.id
                          
                          // Verificar se o pagamento está relacionado à preferência
                          // O order.id pode ser o preferenceId ou o external_reference pode conter o preferenceId
                          let relacionadoPreferencia = false
                          
                          // Verificar order.id
                          if (paymentResult.order?.id) {
                            relacionadoPreferencia = paymentResult.order.id.toString() === venda.preferenceId.toString()
                          }
                          
                          // Verificar external_reference
                          if (!relacionadoPreferencia && paymentResult.external_reference) {
                            relacionadoPreferencia = paymentResult.external_reference.toString() === venda.preferenceId.toString()
                          }
                          
                          // Verificar se o payment tem metadata com preferenceId
                          if (!relacionadoPreferencia && paymentResult.metadata?.preferenceId) {
                            relacionadoPreferencia = paymentResult.metadata.preferenceId.toString() === venda.preferenceId.toString()
                          }
                          
                          // Se o valor corresponde E (metadata corresponde OU está relacionado à preferência)
                          // Também verificar se a data está próxima para evitar falsos positivos
                          const dataPagamento = paymentResult.date_created ? new Date(paymentResult.date_created) : null
                          const dataVendaObj = new Date(venda.createdAt)
                          const diferencaHoras = dataPagamento ? Math.abs(dataPagamento.getTime() - dataVendaObj.getTime()) / (1000 * 60 * 60) : Infinity
                          const dataProxima = diferencaHoras <= 2 // Dentro de 2 horas
                          
                          // Verificar se já existe outra venda com este paymentId (evitar duplicação)
                          const vendaComPaymentId = await prisma.venda.findFirst({
                            where: {
                              paymentId: paymentResult.id?.toString(),
                              id: { not: venda.id },
                            },
                          })
                          
                          // Atualizar se: valor corresponde exatamente, data próxima (dentro de 2 horas), não há outra venda com este paymentId
                          // E (metadata corresponde OU está relacionado à preferência OU valor exato e data muito próxima - 30 min)
                          // Para evitar falsos positivos, ser mais restritivo: precisa ter metadata OU relacionado à preferência OU data muito próxima
                          const correspondeCompletamente = valorCorresponde && dataProxima && !vendaComPaymentId && 
                            (metadataCorresponde || relacionadoPreferencia || (diferencaHoras <= 0.5 && valorCorresponde))
                          
                          if (correspondeCompletamente) {
                            const parcelasPagamento = getParcelasFromPayment(paymentResult)
                            // Se o valor corresponde, a data está próxima e não há outra venda com este paymentId, atualizar
                            console.log(`✅ Pagamento encontrado via busca REST! ID: ${paymentResult.id}, Status: ${paymentResult.status}`)
                            console.log(`   Valor: ${paymentResult.transaction_amount}, Venda: ${venda.total}`)
                            console.log(`   Diferença de horas: ${diferencaHoras.toFixed(2)}`)
                            
                            // Atualizar a venda
                            await prisma.venda.update({
                              where: { id: venda.id },
                              data: {
                                paymentId: paymentResult.id?.toString() || null,
                                statusPagamento: paymentResult.status === 'approved' ? 'approved' : 
                                                paymentResult.status === 'rejected' ? 'rejected' : 
                                                paymentResult.status === 'cancelled' ? 'cancelled' : 'pending',
                                ...(parcelasPagamento ? { parcelas: parcelasPagamento } : {}),
                              },
                            })
                            
                            console.log(`✅ Venda ${venda.id} atualizada automaticamente via busca REST!`)
                            console.log(`   Payment ID: ${paymentResult.id}`)
                            console.log(`   Status: ${paymentResult.status}`)
                            
                            resultados.atualizadas++
                            encontrado = true
                            break
                          }
                        }
                      }
                      
                      if (!encontrado) {
                        console.log(`⚠️ Nenhum pagamento aprovado encontrado para venda ${venda.id} com preferenceId ${venda.preferenceId}`)
                        resultados.naoEncontradas++
                      }
                    } else {
                      console.error(`Erro ao buscar pagamentos via REST: ${searchResponse.status}`)
                      resultados.naoEncontradas++
                    }
                  } else {
                    console.error('MERCADOPAGO_ACCESS_TOKEN não configurado')
                    resultados.naoEncontradas++
                  }
                } catch (restError: any) {
                  console.error(`Erro ao buscar pagamentos via REST para venda ${venda.id}:`, restError.message)
                  resultados.naoEncontradas++
                }
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

