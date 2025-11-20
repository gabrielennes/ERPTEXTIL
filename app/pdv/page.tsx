'use client'
import { useState } from 'react'
import styles from './pdv.module.css'
import { ShoppingCartIcon } from '@/components/icons'

interface ItemCarrinho {
  produto: any;
  quantidade: number;
}

export default function PDVPage() {
  const [busca, setBusca] = useState('')
  const [produto, setProduto] = useState<any | null>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [codigo, setCodigo] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const buscarProduto = async (valor: string) => {
    setProduto(null)
    setMsg('')
    setLoading(true)
    try {
      const resp = await fetch(`/api/produtos?busca=${encodeURIComponent(valor)}`)
      if (resp.ok) {
        const data = await resp.json()
        if (Array.isArray(data) && data.length > 0) {
          setProduto(data[0])
        } else {
          setMsg('Produto não encontrado!')
        }
      } else {
        setMsg('Erro na busca do produto')
      }
    } catch {
      setMsg('Erro na busca do produto')
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

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigo(e.target.value)
  }
  const handleCodigoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && codigo.trim()) {
      buscarProduto(codigo.trim())
      setCodigo('')
    }
  }

  const adicionarAoCarrinho = () => {
    if (!produto) return;
    const idx = carrinho.findIndex(item => item.produto.id === produto.id)
    if (idx > -1) {
      // Produto já está no carrinho: aumentar quantidade
      const novoCarrinho = [...carrinho]
      novoCarrinho[idx].quantidade += 1
      setCarrinho(novoCarrinho)
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }])
    }
    setProduto(null);
    setBusca('');
  }

  const removerItemCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId))
  }
  
  const totalCarrinho = carrinho.reduce((acc, item) => (
    acc + (item.produto.precoVenda * item.quantidade)
  ), 0)

  return (
    <div className={styles.pdvGrid}>
      {/* Coluna esquerda */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>PDV - Vendas</h1>
        <p className={styles.subtitle}>Ponto de venda</p>

        <div className={styles.leitorBox}>
          <h2 className={styles.leitorTitulo}>
            <span>📷</span>
            Leitor de Etiquetas
          </h2>
          <div className={styles.leitorCamera}>
            <span style={{fontSize:64,color:'#9CA3AF', opacity:0.6}}>📷</span>
          </div>
          <button className={styles.leitorButton} disabled style={{margin:'16px 0'}}>Iniciar Leitura</button>
          <p style={{marginTop: 20, marginBottom: 8, fontSize: 14, color: '#6b7280'}}>Ou digite o código manualmente:</p>
          <input
            type="text"
            placeholder="Digite o código de barras..."
            value={codigo}
            onChange={handleCodigoChange}
            onKeyDown={handleCodigoKeyDown}
            className={styles.leitorInput}
          />
          <div className={styles.leitorInstrucoes}>
            <strong>Instruções:</strong>
            <ul style={{marginTop:4,paddingLeft:20,fontSize:13}}>
              <li>Posicione o código de barras dentro da área destacada</li>
              <li>Mantenha uma distância adequada para melhor leitura</li>
              <li>Certifique-se de que há boa iluminação</li>
              <li>Ou digite o código manualmente no campo acima</li>
            </ul>
          </div>
        </div>

        {/* Busca tradicional por nome/sku */}
        <div className={styles.buscaBox}>
          <h2 className={styles.buscaTitulo}>
            <span>🔍</span>
            Buscar Produtos
          </h2>
          <input
            type="text"
            placeholder="Busque por nome, código de barras ou SKU..."
            value={busca}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={styles.buscaInput}
            disabled={loading}
          />
          {msg && <div style={{color:'red', marginTop:8, fontSize:14}}>{msg}</div>}
        </div>

        {/* Mostra produto encontrado e botão de adicionar ao carrinho */}
        {produto && (
          <div className={styles.produtoBox}>
            <div><strong>{produto.nome}</strong> (SKU: {produto.variacoes?.[0]?.sku})</div>
            <div>Preço: <span style={{fontWeight:600}}>R$ {produto.precoVenda.toFixed(2)}</span></div>
            <div>Marca: {produto.marca || 'N/A'}</div>
            <div>Estoque: {produto.variacoes?.reduce((acc: number, v: any) => acc + (v.estoque || 0), 0)}</div>
            <button onClick={adicionarAoCarrinho} className={styles.addCartButton}>Adicionar ao Carrinho</button>
          </div>
        )}
      </div>

      {/* Coluna direita: Carrinho de compras */}
      <div className={styles.rightPanel}>
        <h2 className={styles.carrinhoTitulo}>
          <ShoppingCartIcon size={20} color="#374151" style={{ marginRight: '8px' }} />
          Carrinho de Compras
        </h2>
        {carrinho.length === 0 ? (
          <div className={styles.carrinhoVazio}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <ShoppingCartIcon size={64} color="#059669" />
            </div>
            <p>Carrinho vazio<br/><span style={{fontSize:14}}>Adicione produtos para começar</span></p>
          </div>
        ) : (
          <div className={styles.carrinhoLista}>
            {carrinho.map(item => (
              <div className={styles.carrinhoItem} key={item.produto.id}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{item.produto.nome}</div>
                  <div style={{fontSize:13, color:'gray'}}>SKU: {item.produto.variacoes?.[0]?.sku}</div>
                  <div style={{fontSize:13}}>Qtd: {item.quantidade}</div>
                </div>
                <div style={{fontWeight:600,marginRight:16}}>
                  R$ {(item.produto.precoVenda * item.quantidade).toFixed(2)}
                </div>
                <button
                  className={styles.removeItemButton}
                  onClick={() => removerItemCarrinho(item.produto.id)}
                  title="Remover"
                >✖</button>
              </div>
            ))}
            <div className={styles.carrinhoTotal}>
              Total: <strong>R$ {totalCarrinho.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

