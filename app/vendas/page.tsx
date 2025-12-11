'use client'
import { useState, useEffect } from 'react'
import styles from './vendas.module.css'
import { ClockIcon, FilterIcon, XIcon, CheckIcon, RefreshIcon, TagIcon, DownloadIcon } from '@/components/icons'

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
  numero?: string | null
  total: number
  subtotal: number
  desconto: number
  taxa: number
  metodoPagamento: string
  parcelas: number
  statusPagamento: string
  paymentId: string | null
  preferenceId: string | null
  dataVenda: string
  createdAt: string
  itens: ItemVenda[]
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInicial, setDataInicial] = useState<string>('')
  const [dataFinal, setDataFinal] = useState<string>('')

  const carregarVendas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir query string com filtros de data
      const params = new URLSearchParams()
      if (dataInicial) {
        params.append('dataInicial', dataInicial)
      }
      if (dataFinal) {
        params.append('dataFinal', dataFinal)
      }
      
      const queryString = params.toString()
      const url = `/api/vendas${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setVendas(data.vendas || [])
      } else {
        setError('Erro ao carregar vendas')
      }
    } catch (err) {
      console.error('Erro ao carregar vendas:', err)
      setError('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarVendas()
  }, [])

  // Recarregar vendas quando os filtros mudarem (opcional - pode remover se preferir filtrar apenas ao clicar no botão)
  // useEffect(() => {
  //   if (dataInicial || dataFinal) {
  //     const timeoutId = setTimeout(() => {
  //       carregarVendas()
  //     }, 500)
  //     return () => clearTimeout(timeoutId)
  //   }
  // }, [dataInicial, dataFinal])

  const formatarData = (data: string) => {
    const date = new Date(data)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatarNumeroPedido = (numero: string | null | undefined) => {
    if (!numero) return null
    // Remove "PDV" ou "PDV-" do início do número se existir
    return numero.replace(/^PDV-?/i, '')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { text: 'Aprovado', color: '#10b981' }
      case 'pending':
        return { text: 'Pendente', color: '#f59e0b' }
      case 'rejected':
        return { text: 'Rejeitado', color: '#ef4444' }
      case 'cancelled':
        return { text: 'Cancelado', color: '#6b7280' }
      default:
        return { text: status, color: '#6b7280' }
    }
  }

  const getMetodoPagamentoIcon = (metodo: string) => {
    switch (metodo) {
      case 'dinheiro':
        return '💵'
      case 'cartao':
        return '💳'
      case 'pix':
        return '📱'
      default:
        return '💰'
    }
  }

  const atualizarStatusVenda = async (vendaId: string, paymentId: string | null) => {
    try {
      // Se não tiver paymentId, buscar pela preferência
      if (!paymentId) {
        // Buscar a venda para pegar o preferenceId
        const venda = vendas.find(v => v.id === vendaId)
        if (!venda || !venda.preferenceId) {
          alert('Esta venda não possui Payment ID nem Preference ID. Use o botão "Usar Nº Transação" para atualizar.')
          return
        }

        // Buscar e atualizar automaticamente pela preferência
        const response = await fetch('/api/pagamentos/buscar-e-atualizar-automatico', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendaId,
            preferenceId: venda.preferenceId,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.encontrado && result.paymentId) {
            alert(`✅ Pagamento encontrado e atualizado!\n\nPayment ID: ${result.paymentId}\nStatus: ${result.status}`)
            await carregarVendas()
          } else {
            // Se o pagamento foi aprovado no Mercado Pago mas não encontramos automaticamente,
            // orientar o usuário a usar o número do comprovante
            alert(`⏳ Pagamento não encontrado automaticamente.\n\nSe o pagamento já foi aprovado no Mercado Pago:\n\n1. Abra o comprovante do pagamento\n2. Procure pelo "Número da transação"\n3. Use o botão "🔢 Usar Nº Transação" e cole o número\n\nOu tente novamente em alguns segundos.`)
          }
        } else {
          const error = await response.json()
          alert(`Erro: ${error.error || 'Erro ao buscar pagamento'}\n\nSe o pagamento já foi aprovado, use o botão "🔢 Usar Nº Transação" com o número do comprovante.`)
        }
        return
      }

      // Se tiver paymentId, atualizar diretamente
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

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Status atualizado!\n\nStatus: ${result.paymentStatus}`)
        await carregarVendas()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error || 'Erro ao atualizar status'}`)
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status da venda')
    }
  }

  const marcarComoAprovada = async (vendaId: string) => {
    try {
      const response = await fetch(`/api/vendas/${vendaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusPagamento: 'approved' }),
      })

      if (response.ok) {
        alert('Venda marcada como aprovada!')
        await carregarVendas()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error || 'Erro ao atualizar venda'}`)
      }
    } catch (err) {
      console.error('Erro ao marcar como aprovada:', err)
      alert('Erro ao atualizar venda')
    }
  }

  const vendasAprovadas = vendas.filter((v) => v.statusPagamento === 'approved').length
  const totalVendas = vendas
    .filter((v) => v.statusPagamento === 'approved')
    .reduce((acc, v) => acc + v.total, 0)

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ClockIcon size={64} color="#7c3aed" />
            </div>
            <h2>Carregando vendas...</h2>
            <p>As vendas realizadas aparecerão aqui</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Histórico de Vendas</h1>
        <div className={styles.errorContainer}>
          <p>Erro: {error}</p>
          <button
            onClick={carregarVendas}
            className={styles.errorButton}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  const limparFiltros = () => {
    setDataInicial('')
    setDataFinal('')
  }

  const handleExportCSV = () => {
    if (vendas.length === 0) {
      alert('Não há vendas para exportar')
      return
    }

    const escapeCSV = (value: string | number | null): string => {
      if (value === null || value === undefined) return '""'
      const str = String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const separator = ';'
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')

    // Cabeçalhos do CSV
    const headers = [
      'ID da Venda',
      'Data/Hora',
      'Status',
      'Método de Pagamento',
      'Subtotal',
      'Desconto',
      'Taxa',
      'Total',
      'Payment ID',
      'Preference ID',
      'Produto',
      'SKU',
      'Quantidade',
      'Preço Unitário',
      'Subtotal Item',
    ]

    // Criar linhas do CSV - uma linha por item de venda
    const rows: string[][] = []

    vendas.forEach((venda) => {
      const dataFormatada = formatarData(venda.createdAt)
      const status = venda.statusPagamento === 'approved' ? 'Aprovada' : 
                     venda.statusPagamento === 'pending' ? 'Pendente' : 
                     venda.statusPagamento === 'rejected' ? 'Rejeitada' : venda.statusPagamento

      // Se a venda tem itens, criar uma linha para cada item
      if (venda.itens && venda.itens.length > 0) {
        venda.itens.forEach((item, index) => {
          // Na primeira linha do item, incluir dados da venda
          // Nas linhas subsequentes, deixar vazio para evitar duplicação
          if (index === 0) {
            rows.push([
              venda.id.slice(-8).toUpperCase(),
              dataFormatada,
              status,
              venda.metodoPagamento,
              venda.subtotal.toString(),
              venda.desconto.toString(),
              venda.taxa.toString(),
              venda.total.toString(),
              venda.paymentId || '',
              venda.preferenceId || '',
              item.produto.nome,
              item.variacao?.sku || '',
              item.quantidade.toString(),
              item.precoUnitario.toString(),
              item.subtotal.toString(),
            ])
          } else {
            // Linhas adicionais do mesmo pedido (outros itens)
            rows.push([
              '', // ID vazio para indicar que é continuação
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              item.produto.nome,
              item.variacao?.sku || '',
              item.quantidade.toString(),
              item.precoUnitario.toString(),
              item.subtotal.toString(),
            ])
          }
        })
      } else {
        // Venda sem itens (não deveria acontecer, mas por segurança)
        rows.push([
          venda.id.slice(-8).toUpperCase(),
          dataFormatada,
          status,
          venda.metodoPagamento,
          venda.subtotal.toString(),
          venda.desconto.toString(),
          venda.taxa.toString(),
          venda.total.toString(),
          venda.paymentId || '',
          venda.preferenceId || '',
          '',
          '',
          '',
          '',
          '',
        ])
      }
    })

    // Converter para formato CSV
    const csvContent = [
      headers.map(escapeCSV).join(separator),
      ...rows.map((row) => row.map(escapeCSV).join(separator)),
    ].join('\n')

    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    // Criar link de download
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `historico_vendas_${hoje}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(url)
    }, 100)
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerActions}>
        <div>
          <h1 className={styles.title}>Histórico de Vendas</h1>
          <p className={styles.subtitle}>Todas as vendas realizadas</p>
        </div>
        <div className={styles.headerButtons}>
          <button
            onClick={handleExportCSV}
            disabled={vendas.length === 0}
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            title="Exportar histórico de vendas para CSV"
          >
            <DownloadIcon size={18} color="white" />
            Exportar CSV
          </button>
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
            className={`${styles.actionButton} ${styles.actionButtonSuccess}`}
            title="Atualizar status de todas as vendas pendentes"
          >
            <CheckIcon size={18} color="white" />
            Atualizar Status
          </button>
          <button
            onClick={carregarVendas}
            className={`${styles.actionButton} ${styles.actionButtonInfo}`}
          >
            <RefreshIcon size={18} color="white" />
            Recarregar
          </button>
        </div>
      </div>

      {/* Filtro de Data */}
      <div className={styles.filterSection}>
        <div className={styles.filterTitle}>
          Filtro de Data
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              Data Inicial
            </label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>
              Data Final
            </label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterButtons}>
            <button
              onClick={carregarVendas}
              className={styles.filterButton}
            >
              <FilterIcon size={18} color="white" />
              Filtrar
            </button>
            {(dataInicial || dataFinal) && (
              <button
                onClick={() => {
                  limparFiltros()
                  setTimeout(carregarVendas, 100)
                }}
                className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
              >
                <XIcon size={18} color="currentColor" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total de Vendas</div>
          <div className={styles.metricValue}>{vendas.length}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Vendas Aprovadas</div>
          <div className={styles.metricValueSuccess}>{vendasAprovadas}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Arrecadado</div>
          <div className={styles.metricValueSuccess}>
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
        <div className={styles.vendasList}>
          {vendas.map((venda) => {
            const status = getStatusBadge(venda.statusPagamento)
            return (
              <div
                key={venda.id}
                className={styles.vendaCard}
              >
                <div className={styles.vendaHeader}>
                  <div className={styles.vendaInfo}>
                    <div className={styles.vendaTitleRow}>
                      <span className={styles.vendaIcon}>{getMetodoPagamentoIcon(venda.metodoPagamento)}</span>
                      <h3 className={styles.vendaTitle}>
                        {venda.numero ? `Venda ${formatarNumeroPedido(venda.numero)}` : `Venda #${venda.id.slice(-8).toUpperCase()}`}
                      </h3>
                    </div>
                    <div className={styles.vendaStatusRow}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: `${status.color}15`,
                          color: status.color,
                          border: `1px solid ${status.color}30`,
                        }}
                      >
                        {status.text}
                      </span>
                      {venda.statusPagamento === 'pending' && (
                        <div className={styles.vendaActions}>
                          <button
                            onClick={() => atualizarStatusVenda(venda.id, venda.paymentId)}
                            className={`${styles.vendaButton} ${styles.vendaButtonUpdate}`}
                            title="Buscar e atualizar status do pagamento automaticamente"
                          >
                            <RefreshIcon size={16} color="white" />
                            Atualizar
                          </button>
                          <button
                            onClick={async () => {
                              const paymentId = prompt(
                                'Cole o número da transação do comprovante do Mercado Pago:\n\n' +
                                'No comprovante, procure por "Número da transação"\n' +
                                'Exemplo: 134150661619\n\n' +
                                'Cole o número abaixo:'
                              )
                              if (paymentId && paymentId.trim()) {
                                await atualizarStatusVenda(venda.id, paymentId.trim())
                              }
                            }}
                            className={`${styles.vendaButton} ${styles.vendaButtonTransaction}`}
                            title="Atualizar usando o número da transação do comprovante"
                          >
                            <TagIcon size={16} color="white" />
                            Usar Nº Transação
                          </button>
                          <button
                            onClick={() => marcarComoAprovada(venda.id)}
                            className={`${styles.vendaButton} ${styles.vendaButtonApprove}`}
                            title="Marcar como aprovada manualmente (para testes Sandbox)"
                          >
                            <CheckIcon size={16} color="white" />
                            Aprovar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={styles.vendaDate}>
                      <div>Data da Venda: {formatarData(venda.dataVenda)}</div>
                      <div className={styles.vendaDateSub}>
                        Criado em: {formatarData(venda.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className={styles.vendaTotal}>
                    <div className={styles.vendaTotalValue}>
                      R$ {venda.total.toFixed(2)}
                    </div>
                    <div className={styles.vendaTotalMethod}>
                      {venda.metodoPagamento}
                      {venda.parcelas > 1 ? ` • ${venda.parcelas}x` : ''}
                    </div>
                  </div>
                </div>

                {/* Itens da Venda */}
                <div className={styles.vendaItens}>
                  <div className={styles.vendaItensTitle}>
                    Itens ({venda.itens.length})
                  </div>
                  <div className={styles.vendaItensList}>
                    {venda.itens.map((item) => (
                      <div
                        key={item.id}
                        className={styles.vendaItem}
                      >
                        <div className={styles.vendaItemInfo}>
                          <div className={styles.vendaItemName}>{item.produto.nome}</div>
                          {item.variacao && (
                            <div className={styles.vendaItemSku}>
                              SKU: {item.variacao.sku}
                            </div>
                          )}
                          <div className={styles.vendaItemQuantity}>
                            {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                          </div>
                        </div>
                        <div className={styles.vendaItemPrice}>
                          R$ {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detalhes */}
                {venda.desconto > 0 || venda.taxa > 0 ? (
                  <div className={styles.vendaDetails}>
                    <div>
                      {venda.desconto > 0 && (
                        <div className={styles.vendaDetailsRow}>
                          <span>Desconto: -R$ {venda.desconto.toFixed(2)}</span>
                        </div>
                      )}
                      {venda.taxa > 0 && (
                        <div className={styles.vendaDetailsRow}>
                          <span>Taxa: +R$ {venda.taxa.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className={`${styles.vendaDetailsRow} ${styles.vendaDetailsLabel}`}>
                      <span>Subtotal: R$ {venda.subtotal.toFixed(2)}</span>
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
