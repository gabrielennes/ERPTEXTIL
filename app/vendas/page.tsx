'use client'
import { useState, useEffect } from 'react'
import styles from './vendas.module.css'

interface ItemVenda {
  id: string
  quantidade: number
  precoUnitario: number
  subtotal: number
  produto: {
    id: string
    nome: string
  }
  variacao: {
    id: string
    sku: string
  } | null
}

interface Venda {
  id: string
  total: number
  subtotal: number
  desconto: number
  taxa: number
  metodoPagamento: string
  statusPagamento: string | null
  paymentId: string | null
  createdAt: string
  itens: ItemVenda[]
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    carregarVendas()
  }, [])

  const carregarVendas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vendas')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar vendas')
      }

      const data = await response.json()
      setVendas(data.vendas || [])
    } catch (err: any) {
      console.error('Erro ao carregar vendas:', err)
      setError(err.message || 'Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const marcarComoAprovada = async (vendaId: string) => {
    if (!confirm('Deseja marcar esta venda como APROVADA manualmente?\n\nIsso é útil para testes no ambiente Sandbox onde os pagamentos podem não ser realmente processados.')) {
      return
    }

    try {
      const response = await fetch('/api/vendas/' + vendaId, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusPagamento: 'approved',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar status')
      }

      alert('✅ Venda marcada como aprovada!')
      carregarVendas()
    } catch (err: any) {
      console.error('Erro ao marcar como aprovada:', err)
      alert(`Erro: ${err.message}`)
    }
  }

  const atualizarStatusVenda = async (vendaId: string, paymentId: string | null) => {
    try {
      // Se não tiver paymentId, tentar buscar automaticamente primeiro
      if (!paymentId) {
        // Tentar buscar pagamentos recentes
        const buscaResponse = await fetch('/api/pagamentos/buscar-pagamentos-recentes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vendaId }),
        })

        if (buscaResponse.ok) {
          const buscaData = await buscaResponse.json()
          if (buscaData.encontrado && buscaData.paymentId) {
            paymentId = buscaData.paymentId
            // Continuar com a atualização usando o paymentId encontrado
          } else {
            // Se não encontrou, pedir ao usuário
            const paymentIdInput = prompt(
              '⚠️ Pagamento não encontrado automaticamente.\n\n' +
              '📋 Para encontrar o número da transação:\n\n' +
              '1. No comprovante do Mercado Pago, procure por:\n' +
              '   "Número da transação" ou "Transaction number"\n\n' +
              '2. Ou na página de Atividade do Mercado Pago,\n' +
              '   clique na transação e copie o ID\n\n' +
              '3. Ou acesse:\n' +
              '   https://www.mercadopago.com.br/developers/panel\n' +
              '   Vá em "Suas integrações" > "Pagamentos"\n\n' +
              '💡 Cole o número da transação abaixo:\n' +
              '(ou deixe em branco para cancelar)'
            )
            
            if (!paymentIdInput || !paymentIdInput.trim()) {
              return
            }
            
            paymentId = paymentIdInput.trim()
          }
        } else {
          // Se a busca falhou, pedir manualmente
          const paymentIdInput = prompt(
            '📋 Esta venda não possui ID de pagamento salvo.\n\n' +
            'Para encontrar o número da transação:\n\n' +
            '1. No comprovante do Mercado Pago, procure por:\n' +
            '   "Número da transação" ou "Transaction number"\n\n' +
            '2. Ou na página de Atividade do Mercado Pago,\n' +
            '   clique na transação e copie o ID\n\n' +
            '3. Ou acesse:\n' +
            '   https://www.mercadopago.com.br/developers/panel\n' +
            '   Vá em "Suas integrações" > "Pagamentos"\n\n' +
            '💡 Cole o número da transação abaixo:\n' +
            '(ou deixe em branco para cancelar)'
          )
          
          if (!paymentIdInput || !paymentIdInput.trim()) {
            return
          }
          
          paymentId = paymentIdInput.trim()
        }
      }

      const response = await fetch('/api/pagamentos/atualizar-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          vendaId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar status')
      }

      const result = await response.json()
      const statusText = result.paymentStatus === 'approved' ? '✅ Aprovado' : 
                        result.paymentStatus === 'rejected' ? '❌ Rejeitado' : 
                        result.paymentStatus === 'cancelled' ? '🚫 Cancelado' : 
                        '⏳ Pendente'
      alert(`✅ Status atualizado com sucesso!\n\n📋 Venda: ${vendaId.slice(-8).toUpperCase()}\n💳 Payment ID: ${paymentId}\n📊 Status: ${statusText}`)
      carregarVendas() // Recarregar lista
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      alert(`❌ Erro ao atualizar status:\n\n${err.message}\n\nVerifique se o payment_id está correto.`)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return { text: 'Pendente', color: '#f59e0b' }
    
    switch (status) {
      case 'approved':
        return { text: 'Aprovado', color: '#10b981' }
      case 'rejected':
        return { text: 'Recusado', color: '#ef4444' }
      case 'pending':
        return { text: 'Pendente', color: '#f59e0b' }
      case 'cancelled':
        return { text: 'Cancelado', color: '#6b7280' }
      default:
        return { text: status, color: '#6b7280' }
    }
  }

  const getMetodoPagamentoIcon = (metodo: string) => {
    switch (metodo.toLowerCase()) {
      case 'dinheiro':
        return '💵'
      case 'cartao':
        return '💳'
      case 'pix':
        return '📱'
      default:
        return '💳'
    }
  }

  const totalVendas = vendas.reduce((acc, venda) => acc + venda.total, 0)
  const vendasAprovadas = vendas.filter(v => v.statusPagamento === 'approved').length

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Histórico de Vendas</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando vendas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Histórico de Vendas</h1>
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
          <p>Erro: {error}</p>
          <button
            onClick={carregarVendas}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className={styles.title}>Histórico de Vendas</h1>
          <p className={styles.subtitle}>Todas as vendas realizadas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={async () => {
              try {
                setLoading(true)
                // Primeiro atualizar todas as vendas pendentes
                const updateResponse = await fetch('/api/pagamentos/atualizar-todas-pendentes', {
                  method: 'POST',
                })
                if (updateResponse.ok) {
                  const result = await updateResponse.json()
                  if (result.atualizadas > 0) {
                    alert(`${result.atualizadas} venda(s) atualizada(s) com sucesso!`)
                  }
                }
                // Depois recarregar a lista
                await carregarVendas()
              } catch (err) {
                console.error('Erro:', err)
                carregarVendas()
              }
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
            title="Atualizar status de todas as vendas pendentes"
          >
            ✅ Atualizar Status
          </button>
          <button
            onClick={carregarVendas}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            🔄 Recarregar
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total de Vendas</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>{vendas.length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Vendas Aprovadas</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>{vendasAprovadas}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Arrecadado</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>
            R$ {totalVendas.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Lista de Vendas */}
      {vendas.length === 0 ? (
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🕐</div>
            <h2>Nenhuma venda realizada</h2>
            <p>As vendas realizadas aparecerão aqui</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {vendas.map((venda) => {
            const status = getStatusBadge(venda.statusPagamento)
            return (
              <div
                key={venda.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{getMetodoPagamentoIcon(venda.metodoPagamento)}</span>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        Venda #{venda.id.slice(-8).toUpperCase()}
                      </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: `${status.color}20`,
                          color: status.color,
                        }}
                      >
                        {status.text}
                      </span>
                      {venda.statusPagamento === 'pending' && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => atualizarStatusVenda(venda.id, venda.paymentId)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title="Buscar e atualizar status do pagamento automaticamente"
                          >
                            🔄 Atualizar
                          </button>
                          <button
                            onClick={async () => {
                              const paymentId = prompt(
                                '📋 Cole o número da transação do comprovante do Mercado Pago:\n\n' +
                                'No comprovante, procure por "Número da transação"\n' +
                                'Exemplo: 134150661619\n\n' +
                                'Cole o número abaixo:'
                              )
                              if (paymentId && paymentId.trim()) {
                                await atualizarStatusVenda(venda.id, paymentId.trim())
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title="Atualizar usando o número da transação do comprovante"
                          >
                            🔢 Usar Nº Transação
                          </button>
                          <button
                            onClick={() => marcarComoAprovada(venda.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title="Marcar como aprovada manualmente (para testes Sandbox)"
                          >
                            ✅ Aprovar
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatarData(venda.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
                      R$ {venda.total.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {venda.metodoPagamento}
                    </div>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                  marginTop: '16px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                    Itens ({venda.itens.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {venda.itens.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.produto.nome}</div>
                          {item.variacao && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              SKU: {item.variacao.sku}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          R$ {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detalhes */}
                {venda.desconto > 0 || venda.taxa > 0 ? (
                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '12px',
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#6b7280',
                  }}>
                    <div>
                      {venda.desconto > 0 && (
                        <div>Desconto: -R$ {venda.desconto.toFixed(2)}</div>
                      )}
                      {venda.taxa > 0 && (
                        <div>Taxa: +R$ {venda.taxa.toFixed(2)}</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      Subtotal: R$ {venda.subtotal.toFixed(2)}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
