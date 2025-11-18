'use client'
import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import styles from './pdv.module.css'
import ViewProductModal from '@/components/ViewProductModal'
import MetricCard from '@/components/MetricCard'

interface ItemCarrinho {
  produto: any;
  quantidade: number;
}

export default function PDVPage() {
  const [busca, setBusca] = useState('')
  const [produto, setProduto] = useState<any | null>(null)
  const [produtosEncontrados, setProdutosEncontrados] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [codigoLido, setCodigoLido] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [produtoParaVisualizar, setProdutoParaVisualizar] = useState<any | null>(null)
  const [leitorAtivo, setLeitorAtivo] = useState(false)
  const [erroCamera, setErroCamera] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const ultimoCodigoLidoRef = useRef<string>('')

  // Calcular vendas de hoje (mock - pode ser substituído por API real)
  const vendasHoje = carrinho.reduce((acc, item) => (
    acc + (item.produto.precoVenda * item.quantidade)
  ), 0)

  const buscarProduto = async (valor: string) => {
    setProduto(null)
    setProdutosEncontrados([])
    setMsg('')
    setLoading(true)
    try {
      const resp = await fetch(`/api/produtos?busca=${encodeURIComponent(valor)}`)
      if (resp.ok) {
        const data = await resp.json()
        if (Array.isArray(data) && data.length > 0) {
          setProdutosEncontrados(data)
          setProduto(data[0])
          setCodigoLido(valor)
        } else {
          setMsg('Produto não encontrado!')
          setCodigoLido('')
        }
      } else {
        setMsg('Erro na busca do produto')
        setCodigoLido('')
      }
    } catch {
      setMsg('Erro na busca do produto')
      setCodigoLido('')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busca.trim()) {
      buscarProduto(busca.trim())
    }
  }

  const handleBuscarClick = () => {
    if (busca.trim()) {
      buscarProduto(busca.trim())
    }
  }

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigo(e.target.value)
  }

  const handleCodigoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && codigo.trim()) {
      buscarProduto(codigo.trim())
      setCodigo('')
    }
  }

  const pararLeitura = async () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
        codeReaderRef.current = null
      } catch (error) {
        console.error('Erro ao parar leitura:', error)
      }
    }
    setLeitorAtivo(false)
    setErroCamera('')
    ultimoCodigoLidoRef.current = ''
    
    // Parar todas as tracks de vídeo
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }

  const iniciarLeitura = async () => {
    try {
      setErroCamera('')
      setLeitorAtivo(true)

      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      // Listar câmeras disponíveis
      const videoInputDevices = await codeReader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        setErroCamera('Nenhuma câmera encontrada')
        setLeitorAtivo(false)
        return
      }

      // Usar a primeira câmera disponível (ou a traseira se disponível)
      const selectedDeviceId = videoInputDevices[0].deviceId
      
      // Iniciar leitura
      if (videoRef.current) {
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const codigoLido = result.getText().trim()
              
              // Evitar processar o mesmo código múltiplas vezes
              if (codigoLido && codigoLido !== ultimoCodigoLidoRef.current) {
                ultimoCodigoLidoRef.current = codigoLido
                console.log('Código lido:', codigoLido)
                
                // Buscar produto automaticamente
                buscarProduto(codigoLido)
                
                // Parar leitura após detectar
                setTimeout(() => {
                  pararLeitura()
                  ultimoCodigoLidoRef.current = ''
                }, 500)
              }
            }
            
            if (error && error.name !== 'NotFoundException') {
              // NotFoundException é normal quando não há código na tela
              console.error('Erro na leitura:', error)
            }
          }
        )
      }
    } catch (error: any) {
      console.error('Erro ao iniciar câmera:', error)
      setErroCamera(error.message || 'Erro ao acessar a câmera. Verifique as permissões.')
      setLeitorAtivo(false)
    }
  }

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      pararLeitura()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const adicionarAoCarrinho = (produtoParaAdicionar?: any) => {
    const produtoFinal = produtoParaAdicionar || produto
    if (!produtoFinal) return;
    
    const idx = carrinho.findIndex(item => item.produto.id === produtoFinal.id)
    if (idx > -1) {
      // Produto já está no carrinho: aumentar quantidade
      const novoCarrinho = [...carrinho]
      novoCarrinho[idx].quantidade += 1
      setCarrinho(novoCarrinho)
    } else {
      setCarrinho([...carrinho, { produto: produtoFinal, quantidade: 1 }])
    }
    setProduto(null)
    setProdutosEncontrados([])
    setBusca('')
    setCodigo('')
    setCodigoLido('')
  }

  const atualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItemCarrinho(produtoId)
      return
    }
    setCarrinho(prev => 
      prev.map(item => 
        item.produto.id === produtoId 
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    )
  }

  const removerItemCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId))
  }
  
  const totalCarrinho = carrinho.reduce((acc, item) => {
    const preco = item.produto.precoVenda || 0
    return acc + (preco * item.quantidade)
  }, 0)

  const subtotal = totalCarrinho
  const desconto = 0
  const taxa = 0
  const total = subtotal - desconto + taxa

  const visualizarProduto = (prod: any) => {
    setProdutoParaVisualizar(prod)
    setMostrarModal(true)
  }

  const finalizarVenda = () => {
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar a venda')
      return
    }
    // Aqui você pode implementar a lógica de finalização de venda
    alert(`Venda finalizada! Total: R$ ${total.toFixed(2)}`)
    setCarrinho([])
  }

  const limparCarrinho = () => {
    if (confirm('Deseja limpar o carrinho?')) {
      setCarrinho([])
    }
  }

  return (
    <div className={styles.container}>
      {/* Header com métricas */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>PDV - Vendas</h1>
        <div className={styles.metricsContainer}>
          <MetricCard
            title="Vendas Hoje"
            value={`R$ ${vendasHoje.toFixed(2)}`}
            icon={<span style={{ fontSize: '20px' }}>📈</span>}
            iconColor="#10b981"
          />
          <MetricCard
            title="Itens no Carrinho"
            value={carrinho.reduce((acc, item) => acc + item.quantidade, 0).toString()}
            icon={<span style={{ fontSize: '20px' }}>🛒</span>}
            iconColor="#3b82f6"
          />
        </div>
      </div>

      <div className={styles.pdvGrid}>
        {/* Coluna esquerda - Leitor e Busca */}
        <div className={styles.leftPanel}>
          {/* Leitor de Etiquetas */}
          <div className={styles.leitorBox}>
            <h2 className={styles.leitorTitulo}>
              <span>📷</span>
              Leitor de Etiquetas
            </h2>
            <div className={styles.leitorCamera}>
              {leitorAtivo ? (
                <video
                  ref={videoRef}
                  className={styles.videoElement}
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <span style={{ fontSize: 64, color: '#9CA3AF', opacity: 0.6 }}>📷</span>
              )}
            </div>
            {erroCamera && (
              <div className={styles.errorMsg} style={{ marginBottom: 12 }}>
                {erroCamera}
              </div>
            )}
            <button 
              className={styles.leitorButton} 
              onClick={leitorAtivo ? pararLeitura : iniciarLeitura}
              style={{ margin: '16px 0' }}
              disabled={loading}
            >
              {leitorAtivo ? '⏹️ Parar Leitura' : '📷 Iniciar Leitura'}
            </button>
            <p style={{ marginTop: 20, marginBottom: 8, fontSize: 14, color: '#6b7280' }}>
              Ou digite o código manualmente:
            </p>
            <input
              id="codigo-input"
              type="text"
              placeholder="Digite o código de barras..."
              value={codigo}
              onChange={handleCodigoChange}
              onKeyDown={handleCodigoKeyDown}
              className={styles.leitorInput}
            />
            {codigoLido && (
              <div className={styles.codigoLido}>
                Código lido: {codigoLido}
              </div>
            )}
            <div className={styles.leitorInstrucoes}>
              <strong>Instruções:</strong>
              <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 13 }}>
                <li>Posicione o código de barras dentro da área destacada</li>
                <li>Mantenha uma distância adequada para melhor leitura</li>
                <li>Certifique-se de que há boa iluminação</li>
                <li>Ou digite o código manualmente no campo acima</li>
              </ul>
            </div>
          </div>

          {/* Busca de Produtos */}
          <div className={styles.buscaBox}>
            <h2 className={styles.buscaTitulo}>
              <span>🔍</span>
              Buscar Produtos
            </h2>
            <div className={styles.buscaInputContainer}>
              <input
                type="text"
                placeholder="Buscar por nome, código de barras ou SKU..."
                value={busca}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.buscaInput}
                disabled={loading}
              />
              <button 
                className={styles.buscarButton}
                onClick={handleBuscarClick}
                disabled={loading || !busca.trim()}
              >
                Buscar
              </button>
            </div>
            {loading && <div className={styles.loading}>Buscando...</div>}
            {msg && <div className={styles.errorMsg}>{msg}</div>}
            
            {/* Lista de produtos encontrados */}
            {produtosEncontrados.length > 0 && (
              <div className={styles.produtosEncontrados}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                  Produtos Encontrados ({produtosEncontrados.length})
                </h3>
                {produtosEncontrados.map((prod) => (
                  <div key={prod.id} className={styles.produtoCard}>
                    <div className={styles.produtoInfo}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{prod.nome}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        SKU: {prod.variacoes?.[0]?.sku || 'N/A'} | 
                        Preço: <strong>R$ {prod.precoVenda?.toFixed(2) || '0,00'}</strong>
                      </div>
                      {prod.marca && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                          Marca: {prod.marca}
                        </div>
                      )}
                    </div>
                    <div className={styles.produtoActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => visualizarProduto(prod)}
                      >
                        👁️ Visualizar
                      </button>
                      <button
                        className={styles.addButton}
                        onClick={() => adicionarAoCarrinho(prod)}
                      >
                        ➕ Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Produto selecionado (primeiro resultado) */}
            {produto && produtosEncontrados.length > 0 && (
              <div className={styles.produtoBox}>
                <div style={{ marginBottom: 12 }}>
                  <strong>{produto.nome}</strong>
                  {produto.variacoes?.[0]?.sku && (
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      SKU: {produto.variacoes[0].sku}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 8 }}>
                  Preço: <span style={{ fontWeight: 600 }}>R$ {produto.precoVenda?.toFixed(2) || '0,00'}</span>
                </div>
                {produto.marca && (
                  <div style={{ marginBottom: 8, fontSize: 14 }}>
                    Marca: {produto.marca}
                  </div>
                )}
                <div style={{ marginBottom: 12, fontSize: 14 }}>
                  Estoque: {produto.variacoes?.reduce((acc: number, v: any) => acc + (v.estoque || 0), 0) || 0}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => visualizarProduto(produto)} 
                    className={styles.viewButton}
                  >
                    👁️ Visualizar
                  </button>
                  <button 
                    onClick={() => adicionarAoCarrinho()} 
                    className={styles.addCartButton}
                  >
                    ➕ Adicionar ao Carrinho
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita - Carrinho de compras */}
        <div className={styles.rightPanel}>
          <h2 className={styles.carrinhoTitulo}>
            <span>🛒</span>
            Carrinho de Compras
          </h2>
          
          {carrinho.length === 0 ? (
            <div className={styles.carrinhoVazio}>
              <span style={{ fontSize: 42 }}>🛒</span>
              <p>
                Carrinho vazio<br/>
                <span style={{ fontSize: 14 }}>Adicione produtos para começar</span>
              </p>
            </div>
          ) : (
            <>
              <div className={styles.carrinhoLista}>
                {carrinho.map(item => {
                  const preco = item.produto.precoVenda || 0
                  const totalItem = preco * item.quantidade
                  return (
                    <div className={styles.carrinhoItem} key={item.produto.id}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.produto.nome}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                          R$ {preco.toFixed(2)} cada
                        </div>
                        <div className={styles.quantidadeControls}>
                          <button
                            className={styles.quantidadeButton}
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                          >
                            −
                          </button>
                          <span className={styles.quantidadeValue}>{item.quantidade}</span>
                          <button
                            className={styles.quantidadeButton}
                            onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>
                          R$ {totalItem.toFixed(2)}
                        </div>
                        <button
                          className={styles.removeItemButton}
                          onClick={() => removerItemCarrinho(item.produto.id)}
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.resumoPedido}>
                <div className={styles.resumoLinha}>
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.resumoLinha}>
                  <span style={{ color: '#dc2626' }}>Desconto:</span>
                  <span style={{ color: '#dc2626' }}>-R$ {desconto.toFixed(2)}</span>
                </div>
                <div className={styles.resumoLinha}>
                  <span style={{ color: '#10b981' }}>Taxa:</span>
                  <span style={{ color: '#10b981' }}>+R$ {taxa.toFixed(2)}</span>
                </div>
                <div className={styles.resumoTotal}>
                  <span>Total:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.metodoPagamento}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Método de Pagamento
                </div>
                <div className={styles.pagamentoButtons}>
                  <button className={`${styles.pagamentoButton} ${styles.pagamentoButtonActive}`}>
                    💵 Dinheiro
                  </button>
                  <button className={styles.pagamentoButton}>
                    💳 Cartão
                  </button>
                  <button className={styles.pagamentoButton}>
                    📱 PIX
                  </button>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button 
                  className={styles.finalizarButton}
                  onClick={finalizarVenda}
                >
                  Finalizar Venda
                </button>
                <button 
                  className={styles.limparButton}
                  onClick={limparCarrinho}
                >
                  Limpar Carrinho
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de visualização de produto */}
      <ViewProductModal
        isOpen={mostrarModal}
        onClose={() => {
          setMostrarModal(false)
          setProdutoParaVisualizar(null)
        }}
        produto={produtoParaVisualizar}
        onEdit={() => {
          setMostrarModal(false)
          // Aqui você pode redirecionar para edição se necessário
        }}
      />
    </div>
  )
}
