'use client'
import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import styles from './pdv.module.css'
import ViewProductModal from '@/components/ViewProductModal'
import MetricCard from '@/components/MetricCard'
import {
  TrendingUpIcon,
  ShoppingCartIcon,
  CameraIcon,
  StopIcon,
  SearchIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  DollarSignIcon,
  CreditCardIcon,
  SmartphoneIcon,
  LightbulbIcon,
} from '@/components/icons'

interface ItemCarrinho {
  produto: any;
  quantidade: number;
}

type MetodoPagamento = 'dinheiro' | 'cartao' | 'pix'

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
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('dinheiro')
  const [parcelas, setParcelas] = useState(1)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
  const [mostrarModalCartao, setMostrarModalCartao] = useState(false)
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    vencimento: '',
    cvv: '',
    cpf: '',
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const ultimoCodigoLidoRef = useRef<string>('')

  // Verificar status de retorno do pagamento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const status = urlParams.get('status')
      // Tentar pegar payment_id de diferentes formas
      const paymentId = urlParams.get('payment_id') || urlParams.get('payment-id') || urlParams.get('paymentId')
      const preferenceId = urlParams.get('preference_id') || urlParams.get('preference-id') || urlParams.get('preferenceId')
      
      console.log('🔍 Parâmetros da URL:', { status, paymentId, preferenceId, allParams: Object.fromEntries(urlParams) })
      
      if (status) {
        // Limpar URL primeiro para evitar múltiplos processamentos
        window.history.replaceState({}, '', window.location.pathname)
        
        if (status === 'success') {
          // Atualizar status da venda antes de mostrar o alert
          if (paymentId && preferenceId) {
            console.log('Atualizando venda com paymentId:', paymentId, 'preferenceId:', preferenceId)
            fetch('/api/pagamentos/atualizar-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId,
                preferenceId,
              }),
            })
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json()
                console.log('✅ Status da venda atualizado:', data)
                alert(`✅ Pagamento aprovado!\n\nVenda: ${data.venda?.id?.slice(-8) || 'N/A'}\nStatus: ${data.paymentStatus}\n\nA página será recarregada.`)
                setCarrinho([])
                // Recarregar a página após 2 segundos para atualizar dados
                setTimeout(() => {
                  window.location.href = '/vendas'
                }, 2000)
              } else {
                const error = await res.json()
                console.error('❌ Erro ao atualizar status:', error)
                alert(`⚠️ Pagamento aprovado, mas houve um erro ao atualizar o status.\n\nErro: ${error.error || 'Desconhecido'}\n\nPayment ID: ${paymentId}\n\nVocê pode atualizar manualmente na página de vendas.`)
                setCarrinho([])
                // Redirecionar para vendas mesmo com erro
                setTimeout(() => {
                  window.location.href = '/vendas'
                }, 3000)
              }
            })
            .catch(err => {
              console.error('❌ Erro ao atualizar status:', err)
              alert(`⚠️ Pagamento aprovado, mas houve um erro de conexão.\n\nPayment ID: ${paymentId}\n\nVocê pode atualizar manualmente na página de vendas.`)
              setCarrinho([])
              setTimeout(() => {
                window.location.href = '/vendas'
              }, 3000)
            })
          } else if (preferenceId) {
            // Se tiver preferenceId mas não paymentId, buscar automaticamente
            console.log('🔍 Buscando pagamento com preferenceId:', preferenceId)
            
            // Função para buscar pagamento com retry
            const buscarPagamento = (tentativa = 1, maxTentativas = 6) => {
              console.log(`🔄 Tentativa ${tentativa}/${maxTentativas} de buscar pagamento...`)
              
              fetch('/api/pagamentos/buscar-por-preference', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  preferenceId,
                }),
              })
              .then(async (res) => {
                const data = await res.json()
                console.log('📊 Resultado da busca:', data)
                
                if (data.encontrado && data.paymentId) {
                  // Pagamento encontrado e já atualizado pela API
                  console.log('✅ Pagamento encontrado! Payment ID:', data.paymentId)
                  alert(`✅ Pagamento confirmado e processado!\n\nVenda: ${data.venda?.id?.slice(-8) || 'N/A'}\nStatus: ${data.status}\nPayment ID: ${data.paymentId}`)
                  setCarrinho([])
                  setTimeout(() => {
                    window.location.href = '/vendas'
                  }, 2000)
                } else if (tentativa < maxTentativas && data.tentarNovamente !== false) {
                  // Tentar novamente após intervalo crescente (2s, 4s, 6s, 8s, 10s)
                  const intervalo = 2000 * tentativa
                  console.log(`⏳ Aguardando ${intervalo/1000}s antes da próxima tentativa...`)
                  setTimeout(() => buscarPagamento(tentativa + 1, maxTentativas), intervalo)
                } else {
                  // Última tentativa falhou - redirecionar para vendas
                  // O webhook deve processar em background
                  alert(`⏳ Pagamento está sendo processado...\n\nO sistema continuará tentando atualizar automaticamente em background.\n\nA venda foi criada. Você será redirecionado para a página de vendas.\n\nSe o status não atualizar em alguns minutos, use o botão "🔄 Atualizar" na venda.`)
                  setCarrinho([])
                  setTimeout(() => {
                    window.location.href = '/vendas'
                  }, 2000)
                }
              })
              .catch((err) => {
                console.error('❌ Erro ao buscar pagamento:', err)
                if (tentativa < maxTentativas) {
                  const intervalo = 2000 * tentativa
                  setTimeout(() => buscarPagamento(tentativa + 1, maxTentativas), intervalo)
                } else {
                  alert(`⚠️ Não foi possível verificar o pagamento após várias tentativas.\n\nPreference ID: ${preferenceId}\n\nA venda foi criada. O webhook deve atualizar automaticamente em alguns segundos.\n\nSe não atualizar, verifique manualmente na página de vendas.`)
                  setCarrinho([])
                  setTimeout(() => {
                    window.location.href = '/vendas'
                  }, 3000)
                }
              })
            }
            
            // Aguardar 2 segundos antes da primeira tentativa (dar tempo para o Mercado Pago processar)
            setTimeout(() => buscarPagamento(1), 2000)
          } else {
            console.warn('⚠️ Retornou do Mercado Pago mas sem paymentId ou preferenceId')
            console.log('URL params:', { status, paymentId, preferenceId })
            alert(`⚠️ ATENÇÃO: Não foi possível capturar informações do pagamento.\n\nNo ambiente Sandbox, o pagamento pode não ter sido realmente processado.\n\nA venda foi criada mas permanecerá como "Pendente".`)
            setCarrinho([])
            setTimeout(() => {
              window.location.href = '/vendas'
            }, 3000)
          }
        } else if (status === 'failure') {
          // Atualizar status mesmo se falhou
          if (paymentId && preferenceId) {
            fetch('/api/pagamentos/atualizar-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId,
                preferenceId,
              }),
            }).catch(err => console.error('Erro ao atualizar status:', err))
          }
          alert('Pagamento recusado. Tente novamente.')
        } else if (status === 'pending') {
          // Atualizar status mesmo se pendente
          if (paymentId && preferenceId) {
            fetch('/api/pagamentos/atualizar-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId,
                preferenceId,
              }),
            }).catch(err => console.error('Erro ao atualizar status:', err))
          }
          alert('Pagamento pendente. Aguardando confirmação.')
        }
      }
    }
  }, [])

  const parcelasDisponiveis = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleMetodoPagamento = (metodo: MetodoPagamento) => {
    setMetodoPagamento(metodo)
    if (metodo !== 'cartao') {
      setParcelas(1)
    }
  }

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

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      alert('Adicione produtos ao carrinho antes de finalizar a venda')
      return
    }

    if (!metodoPagamento) {
      alert('Selecione um método de pagamento')
      return
    }

    // Se for cartão, abrir modal para inserir dados
    // Depois, vamos usar o Checkout Pro do Mercado Pago para processar
    if (metodoPagamento === 'cartao') {
      setMostrarModalCartao(true)
      return
    }

    setProcessandoPagamento(true)

    try {
      // Preparar dados da venda
      const itensVenda = carrinho.map(item => ({
        produtoId: item.produto.id,
        variacaoId: item.produto.variacoes?.[0]?.id || null,
        quantidade: item.quantidade,
        precoUnitario: item.produto.precoVenda,
        subtotal: item.produto.precoVenda * item.quantidade,
        nome: item.produto.nome,
      }))

      // Se for PIX, processar pelo Mercado Pago (Checkout Pro)
      // Cartão já foi tratado acima (abre modal)
      if (metodoPagamento === 'pix') {
        // Primeiro, criar a venda com status pending
        const vendaResponse = await fetch('/api/vendas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itens: itensVenda,
            subtotal,
            desconto,
            taxa,
            total,
            metodoPagamento: metodoPagamento, // 'pix' ou 'cartao' (ambos usam Checkout Pro)
            statusPagamento: 'pending',
            parcelas: 1,
          }),
        })

        if (!vendaResponse.ok) {
          const error = await vendaResponse.json()
          throw new Error(error.error || 'Erro ao criar venda')
        }

        const venda = await vendaResponse.json()

        // Criar preferência de pagamento no Mercado Pago
        const pagamentoResponse = await fetch('/api/pagamentos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: itensVenda.map(item => ({
              id: item.produtoId,
              nome: item.nome,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            })),
            total,
            metadata: {
              vendaId: venda.id,
              userId: 'current-user', // Você pode pegar do session depois
              parcelas: 1,
            },
          }),
        })

        if (!pagamentoResponse.ok) {
          const error = await pagamentoResponse.json()
          throw new Error(error.error || 'Erro ao processar pagamento')
        }

      const pagamento = await pagamentoResponse.json()
      
      // Salvar o preferenceId na venda para facilitar a busca depois
      if (pagamento.id) {
        await fetch(`/api/vendas/${venda.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferenceId: pagamento.id,
          }),
        }).catch(err => console.error('Erro ao salvar preferenceId:', err))
      }

      // Redirecionar para o checkout do Mercado Pago
      // IMPORTANTE: No ambiente de teste, usar init_point (não sandbox_init_point)
      // O sandbox_init_point pode não processar pagamentos reais
      const checkoutUrl = pagamento.init_point || pagamento.sandbox_init_point
      console.log('🔗 URL do checkout:', checkoutUrl)
      console.log('📋 Preferência ID:', pagamento.id)
      console.log('📊 Dados do pagamento:', { init_point: pagamento.init_point, sandbox_init_point: pagamento.sandbox_init_point })
      if (checkoutUrl) {
        window.location.href = checkoutUrl
        return
      } else {
        throw new Error('URL do checkout não disponível')
      }
      }

      // Para pagamento em dinheiro, criar venda diretamente
      if (metodoPagamento === 'dinheiro') {
        const vendaResponse = await fetch('/api/vendas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itens: itensVenda,
            subtotal,
            desconto,
            taxa,
            total,
            metodoPagamento: 'dinheiro',
            statusPagamento: 'approved',
            parcelas: 1,
          }),
        })

        if (!vendaResponse.ok) {
          const error = await vendaResponse.json()
          throw new Error(error.error || 'Erro ao criar venda')
        }

        const venda = await vendaResponse.json()
        alert(`Venda finalizada com sucesso! Total: R$ ${total.toFixed(2)}`)
        setCarrinho([])
      }
    } catch (error: any) {
      console.error('Erro ao finalizar venda:', error)
      alert(`Erro ao finalizar venda: ${error.message}`)
    } finally {
      setProcessandoPagamento(false)
    }
  }

  const processarPagamentoCartao = async () => {
    // Validar dados do cartão
    if (!dadosCartao.numero || !dadosCartao.nome || !dadosCartao.vencimento || !dadosCartao.cvv || !dadosCartao.cpf) {
      alert('Preencha todos os dados do cartão')
      return
    }

    setProcessandoPagamento(true)

    try {
      // Preparar dados da venda
      const itensVenda = carrinho.map(item => ({
        produtoId: item.produto.id,
        variacaoId: item.produto.variacoes?.[0]?.id || null,
        quantidade: item.quantidade,
        precoUnitario: item.produto.precoVenda,
        subtotal: item.produto.precoVenda * item.quantidade,
        nome: item.produto.nome,
      }))

      // Criar venda com status pending
      const vendaResponse = await fetch('/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itens: itensVenda,
          subtotal,
          desconto,
          taxa,
          total,
          metodoPagamento: 'cartao',
          statusPagamento: 'pending',
          parcelas,
        }),
      })

      if (!vendaResponse.ok) {
        const error = await vendaResponse.json()
        throw new Error(error.error || 'Erro ao criar venda')
      }

      const venda = await vendaResponse.json()

      // Usar Checkout Pro do Mercado Pago (mais seguro e funciona sem tokenização)
      // O Checkout Pro permite inserir dados do cartão na página do Mercado Pago
      const pagamentoResponse = await fetch('/api/pagamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itensVenda.map(item => ({
            id: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          })),
          total,
          metadata: {
            vendaId: venda.id,
            userId: 'current-user',
            parcelas,
          },
        }),
      })

      if (!pagamentoResponse.ok) {
        const error = await pagamentoResponse.json()
        throw new Error(error.error || 'Erro ao processar pagamento')
      }

      const pagamento = await pagamentoResponse.json()
      
      // Salvar o preferenceId na venda para facilitar a busca depois
      if (pagamento.id) {
        await fetch(`/api/vendas/${venda.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferenceId: pagamento.id,
          }),
        }).catch(err => console.error('Erro ao salvar preferenceId:', err))
      }

      // Redirecionar para o checkout do Mercado Pago
      // IMPORTANTE: No ambiente de teste, usar init_point (não sandbox_init_point)
      // O sandbox_init_point pode não processar pagamentos reais
      const checkoutUrl = pagamento.init_point || pagamento.sandbox_init_point
      console.log('🔗 URL do checkout (cartão):', checkoutUrl)
      console.log('📋 Preferência ID:', pagamento.id)
      console.log('📊 Dados do pagamento:', { init_point: pagamento.init_point, sandbox_init_point: pagamento.sandbox_init_point })
      if (checkoutUrl) {
        // Fechar modal antes de redirecionar
        setMostrarModalCartao(false)
        window.location.href = checkoutUrl
        return
      } else {
        throw new Error('URL do checkout não disponível')
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error)
      alert(`Erro ao processar pagamento: ${error.message}`)
      setProcessandoPagamento(false)
    }
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
            icon={<TrendingUpIcon size={20} color="#10b981" />}
            iconColor="#10b981"
          />
          <MetricCard
            title="Itens no Carrinho"
            value={carrinho.reduce((acc, item) => acc + item.quantidade, 0).toString()}
            icon={<ShoppingCartIcon size={20} color="#3b82f6" />}
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
              <CameraIcon size={20} color="#1f2937" />
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
                <div className={styles.leitorInativo}>
                  <CameraIcon size={48} color="var(--text-tertiary)" />
                  <span className={styles.leitorInativoText}>Câmera inativa</span>
                </div>
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
              style={{ margin: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading}
            >
              {leitorAtivo ? (
                <>
                  <StopIcon size={18} color="white" />
                  Parar Leitura
                </>
              ) : (
                <>
                  <CameraIcon size={18} color="white" />
                  Iniciar Leitura
                </>
              )}
            </button>
            <p className={styles.instrucoesText}>
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
              <SearchIcon size={20} color="#1f2937" />
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
                      <div className={styles.produtoSku}>
                        SKU: {prod.variacoes?.[0]?.sku || 'N/A'} | 
                        Preço: <strong>R$ {prod.precoVenda?.toFixed(2) || '0,00'}</strong>
                      </div>
                      {prod.marca && (
                        <div className={styles.produtoMarca}>
                          Marca: {prod.marca}
                        </div>
                      )}
                    </div>
                    <div className={styles.produtoActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => visualizarProduto(prod)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <EyeIcon size={16} color="currentColor" />
                        Visualizar
                      </button>
                      <button
                        className={styles.addButton}
                        onClick={() => adicionarAoCarrinho(prod)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <PlusIcon size={16} color="white" />
                        Adicionar
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
                    <div className={styles.produtoSku} style={{ marginTop: 4 }}>
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
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <EyeIcon size={16} color="currentColor" />
                    Visualizar
                  </button>
                  <button 
                    onClick={() => adicionarAoCarrinho()} 
                    className={styles.addCartButton}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <PlusIcon size={16} color="white" />
                    Adicionar ao Carrinho
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita - Carrinho de compras */}
        <div className={styles.rightPanel}>
          <h2 className={styles.carrinhoTitulo}>
            <ShoppingCartIcon size={20} color="#1f2937" />
            Carrinho de Compras
          </h2>
          
          {carrinho.length === 0 ? (
            <div className={styles.carrinhoVazio}>
              <ShoppingCartIcon size={48} color="#9ca3af" />
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
                        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{item.produto.nome}</div>
                        <div className={styles.produtoDescricao}>
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
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <TrashIcon size={18} color="#dc2626" />
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
                  <span className={styles.descontoText}>Desconto:</span>
                  <span className={styles.descontoText}>-R$ {desconto.toFixed(2)}</span>
                </div>
                <div className={styles.resumoLinha}>
                  <span className={styles.taxaText}>Taxa:</span>
                  <span className={styles.taxaText}>+R$ {taxa.toFixed(2)}</span>
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
                  <button 
                    className={`${styles.pagamentoButton} ${metodoPagamento === 'dinheiro' ? styles.pagamentoButtonActive : ''}`}
                    onClick={() => handleMetodoPagamento('dinheiro')}
                  >
                    <DollarSignIcon size={18} color={metodoPagamento === 'dinheiro' ? 'white' : '#6b7280'} />
                    Dinheiro
                  </button>
                  <button 
                    className={`${styles.pagamentoButton} ${metodoPagamento === 'cartao' ? styles.pagamentoButtonActive : ''}`}
                    onClick={() => handleMetodoPagamento('cartao')}
                  >
                    <CreditCardIcon size={18} color={metodoPagamento === 'cartao' ? 'white' : '#6b7280'} />
                    Cartão
                  </button>
                  <button 
                    className={`${styles.pagamentoButton} ${metodoPagamento === 'pix' ? styles.pagamentoButtonActive : ''}`}
                    onClick={() => handleMetodoPagamento('pix')}
                  >
                    <SmartphoneIcon size={18} color={metodoPagamento === 'pix' ? 'white' : '#6b7280'} />
                    PIX
                  </button>
                </div>
                {metodoPagamento === 'cartao' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                      Parcelas no cartão
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        value={parcelas}
                        onChange={(e) => setParcelas(Number(e.target.value))}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14,
                          flex: '0 0 140px',
                        }}
                      >
                        {parcelasDisponiveis.map((parcela) => (
                          <option key={parcela} value={parcela}>
                            {parcela}x
                          </option>
                        ))}
                      </select>
                      <div className={styles.produtoSku}>
                        ≈ R$ {(total / parcelas).toFixed(2)} por parcela
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.actionButtons}>
                <button 
                  className={styles.finalizarButton}
                  onClick={finalizarVenda}
                  disabled={processandoPagamento || carrinho.length === 0}
                >
                  {processandoPagamento ? 'Processando...' : 'Finalizar Venda'}
                </button>
                <button 
                  className={styles.limparButton}
                  onClick={limparCarrinho}
                  disabled={processandoPagamento}
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

      {/* Modal de pagamento com cartão */}
      {mostrarModalCartao && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCardIcon size={20} color="#1f2937" />
                Dados do Cartão
              </h2>
              <button
                onClick={() => {
                  setMostrarModalCartao(false)
                  setDadosCartao({
                    numero: '',
                    nome: '',
                    vencimento: '',
                    cvv: '',
                    cpf: '',
                  })
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.infoBox}>
              <div className={styles.infoBoxTitle}>
                Parcelas selecionadas: <strong>{parcelas}x</strong>
              </div>
              <div className={styles.infoBoxText}>
                Valor estimado por parcela: R$ {(total / parcelas).toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Número do Cartão
              </label>
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={dadosCartao.numero}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '')
                  if (value.length > 16) value = value.slice(0, 16)
                  value = value.replace(/(.{4})/g, '$1 ').trim()
                  setDadosCartao({ ...dadosCartao, numero: value })
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Nome no Cartão
              </label>
              <input
                type="text"
                placeholder="APRO (para teste aprovado)"
                value={dadosCartao.nome}
                onChange={(e) => setDadosCartao({ ...dadosCartao, nome: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 16,
                }}
              />
              <div className={styles.smallText}>
                <LightbulbIcon size={14} color="var(--text-secondary)" />
                Dica: Use "APRO" para pagamentos aprovados no teste
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  Vencimento
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={dadosCartao.vencimento}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length > 4) value = value.slice(0, 4)
                    if (value.length > 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2)
                    }
                    setDadosCartao({ ...dadosCartao, vencimento: value })
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 16,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={dadosCartao.cvv}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    if (value.length > 3) value = value.slice(0, 3)
                    setDadosCartao({ ...dadosCartao, cvv: value })
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 16,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                CPF do Titular
              </label>
              <input
                type="text"
                placeholder="123.456.789-09 (para teste)"
                value={dadosCartao.cpf}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '')
                  if (value.length > 11) value = value.slice(0, 11)
                  value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                  setDadosCartao({ ...dadosCartao, cpf: value })
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 16,
                }}
              />
              <div style={{ 
                fontSize: '11px', 
                color: '#3b82f6', 
                marginTop: '4px',
                padding: '8px',
                backgroundColor: '#eff6ff',
                borderRadius: '4px',
                border: '1px solid #bfdbfe',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CreditCardIcon size={14} color="#3b82f6" />
                  Cartões de Teste:
                </div>
                <div>Mastercard: <code>5031 4332 1540 6351</code></div>
                <div>Visa: <code>4509 9535 6623 3704</code></div>
                <div>CVV: <code>123</code> | Nome: <code>APRO</code> (para aprovar)</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setMostrarModalCartao(false)
                  setDadosCartao({
                    numero: '',
                    nome: '',
                    vencimento: '',
                    cvv: '',
                    cpf: '',
                  })
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={processarPagamentoCartao}
                disabled={processandoPagamento}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: processandoPagamento ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  cursor: processandoPagamento ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {processandoPagamento ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
